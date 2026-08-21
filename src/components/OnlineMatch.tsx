import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { ChevronLeft, Copy, Share2, Users, Wifi, WifiOff, Crown, Eye } from 'lucide-react'
import { supabase, realtimeConfigured, nudgeRealtimeConnection, supabaseProjectHost } from '../lib/supabase'
import type { PlayerState, RemotePlayerSnapshot, ScoreCategory, Settings } from '../lib/types'
import { createPlayer, freshDice, resetRound, rollDice, submitCategory, toggleDie } from '../lib/game'
import { filledCount, normalizeScoreCard, scoreCategory, scoreTotals } from '../lib/scoring'
import { playScoreTone, softVibrate } from '../lib/feedback'
import { TOTAL_ROUNDS } from '../lib/rules'
import { deriveTurnState } from '../lib/turnState'
import { APP_VERSION, MULTIPLAYER_PROTOCOL } from '../lib/protocol'
import DiceTray from './DiceTray'
import DieFace from './DieFace'
import ScoreSheet from './ScoreSheet'
import ResultScreen from './ResultScreen'
import Confetti from './Confetti'

interface Props { code: string; role: 'host'|'guest'; settings: Settings; onExit: () => void }
interface Participant { clientId:string; name:string; role:'host'|'guest'; protocol:number }

type GameMessageBody =
  | { type:'start'; sender:string; participants:Participant[]; gameId:string; seq:number }
  | { type:'authority'; sender:string; participants:Participant[]; gameId:string; player:RemotePlayerSnapshot; table:Record<string,RemotePlayerSnapshot>; seq:number }
  | { type:'state'; sender:string; gameId:string; player:RemotePlayerSnapshot; seq:number }
  | { type:'rolling'; sender:string; gameId:string; rolling:boolean; seq:number }
  | { type:'sync_request'; sender:string; gameId?:string; seq:number }
  | { type:'sync'; sender:string; started:boolean; gameId:string; participants:Participant[]; player:RemotePlayerSnapshot; seq:number }
  | { type:'roster'; sender:string; participants:Participant[]; gameId:string; seq:number }
  | { type:'rematch'; sender:string; gameId:string; participants:Participant[]; seq:number }

type GameMessage = GameMessageBody & { protocol:number }

interface StoredSession {
  version: 5
  started: boolean
  gameId: string
  me: PlayerState
  opponents: Record<string, PlayerState>
  participants: Participant[]
  savedAt: number
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000
const MAX_PLAYERS = 4
const HEARTBEAT_MS = 1800
const AUTHORITY_HEARTBEAT_MS = 2200

function uid() { return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) }
function roomKey(code:string, role:string) { return `kniffli:online:v18:${code.toUpperCase()}:${role}` }
function legacyRoomKeys(code:string, role:string) { return [`kniffli:online:v17:${code.toUpperCase()}:${role}`, `kniffli:online:v15:${code.toUpperCase()}:${role}`] }
function clientKey(code:string, role:string) { return `kniffli:client:${code.toUpperCase()}:${role}` }
function stableClientId(code:string, role:string) {
  try { const key=clientKey(code,role); const existing=localStorage.getItem(key); if(existing)return existing; const created=uid();localStorage.setItem(key,created);return created } catch { return uid() }
}
function normalizeParticipant(p:Partial<Participant>, fallbackProtocol=0):Participant {
  const protocol=Number(p.protocol)
  return { clientId:String(p.clientId??''), name:String(p.name??'Spieler').slice(0,16), role:p.role==='host'?'host':'guest', protocol:Number.isFinite(protocol)&&protocol>0?protocol:fallbackProtocol }
}

function sanitizePlayer(player:PlayerState):PlayerState {
  const dice = Array.isArray(player?.dice) && player.dice.length===5
    ? player.dice.map((d,index)=>({ id:String(d?.id??`d${index}`), value:Number.isInteger(d?.value)&&d.value>=1&&d.value<=6?d.value:1, held:Boolean(d?.held) }))
    : freshDice()
  return { id:String(player?.id??uid()), name:String(player?.name??'Spieler').slice(0,16), scoreCard:normalizeScoreCard(player?.scoreCard), dice, rollsUsed:Math.max(0,Math.min(3,Number(player?.rollsUsed)||0)), submitted:Boolean(player?.submitted) }
}
function loadSession(code:string, role:string): StoredSession | null {
  try {
    const candidates=[localStorage.getItem(roomKey(code,role)),...legacyRoomKeys(code,role).map(key=>localStorage.getItem(key))].filter(Boolean) as string[]
    for(const raw of candidates){
      const parsed=JSON.parse(raw) as Partial<StoredSession> & { version?:number }
      if(Date.now()-Number(parsed.savedAt??0)>SESSION_TTL_MS || !parsed.me || !parsed.opponents || !Array.isArray(parsed.participants)) continue
      const me=sanitizePlayer(parsed.me)
      const opponents=Object.fromEntries(Object.entries(parsed.opponents).map(([id,p])=>[id,sanitizePlayer(p)]))
      const participants=parsed.participants.map(p=>normalizeParticipant(p,MULTIPLAYER_PROTOCOL)).filter(p=>p.clientId)
      return { version:5, started:Boolean(parsed.started), gameId:String(parsed.gameId??''), me, opponents, participants, savedAt:Date.now() }
    }
    return null
  } catch { return null }
}
function saveSession(code:string, role:string, session:StoredSession) { try { localStorage.setItem(roomKey(code,role),JSON.stringify(session)) } catch {} }
function remoteAsPlayer(remote:RemotePlayerSnapshot):PlayerState {
  return sanitizePlayer(remote as PlayerState)
}

function snapshot(player:PlayerState):RemotePlayerSnapshot {
  return { id:player.id,name:player.name,scoreCard:player.scoreCard,dice:player.dice.map(d=>({...d})),rollsUsed:player.rollsUsed,submitted:player.submitted }
}
function mergePlayerSnapshot(existing:PlayerState|undefined,incoming:PlayerState,preferEqual=true):PlayerState {
  if(!existing)return incoming
  const existingCount=filledCount(existing.scoreCard);const incomingCount=filledCount(incoming.scoreCard)
  const mergedCard=normalizeScoreCard(incoming.scoreCard)
  for(const category of Object.keys(existing.scoreCard) as ScoreCategory[]){
    const fixed=existing.scoreCard[category]
    if(typeof fixed==='number')mergedCard[category]=fixed
  }
  if(existingCount>incomingCount)return {...existing,scoreCard:mergedCard,name:incoming.name||existing.name}
  if(existingCount===incomingCount&&!preferEqual)return {...existing,scoreCard:mergedCard,name:incoming.name||existing.name}
  return {...incoming,scoreCard:mergedCard}
}
function tableSnapshot(me:PlayerState,opponents:Record<string,PlayerState>):Record<string,RemotePlayerSnapshot>{
  const table:Record<string,RemotePlayerSnapshot>={[me.id]:snapshot(me)}
  for(const [id,player] of Object.entries(opponents))table[id]=snapshot(player)
  return table
}
function uniqueParticipants(items:Participant[]) {
  const map=new Map<string,Participant>(); items.forEach(p=>{if(p.clientId)map.set(p.clientId,normalizeParticipant(p,0))}); return [...map.values()].slice(0,MAX_PLAYERS)
}
function hostOf(items:Participant[]) { return items.find(p=>p.role==='host')?.clientId ?? '' }


function SpectatorDiceTray({ player, rolling }:{ player:PlayerState; rolling:boolean }) {
  const [preview,setPreview]=useState(player.dice.map(d=>d.value))
  useEffect(()=>{ if(!rolling)setPreview(player.dice.map(d=>d.value)) },[player.dice,rolling])
  useEffect(()=>{
    if(!rolling)return
    const timer=window.setInterval(()=>setPreview(player.dice.map(d=>d.held?d.value:Math.floor(Math.random()*6)+1)),70)
    return()=>window.clearInterval(timer)
  },[rolling,player.dice])
  return <section className="dice-tray spectator-tray" aria-label={`Würfel von ${player.name}`}>
    <div className="tray-head"><span className="eyebrow"><Eye size={14}/> {player.name.toUpperCase()} WÜRFELT</span><span className="roll-counter">Wurf {Math.min(player.rollsUsed+(rolling?1:0),3)}/3</span></div>
    <div className="dice-row">{player.dice.map((die,i)=><DieFace key={die.id} value={preview[i]??die.value} held={die.held} rolling={rolling&&!die.held} index={i} onClick={()=>{}}/>)}</div>
    <div className="spectator-message">{rolling?'Würfel rollen live …':player.rollsUsed===0?'Warte auf den ersten Wurf …':player.submitted?'Punkte eingetragen ✓':'Gehaltene Würfel siehst du direkt mit.'}</div>
  </section>
}

export default function OnlineMatch({code,role,settings,onExit}:Props){
  const normalizedCode=code.toUpperCase()
  const restoredRef=useRef<StoredSession|null>(loadSession(normalizedCode,role)); const restored=restoredRef.current
  const clientId=useRef(stableClientId(normalizedCode,role)).current
  const initialName=restored?.me.name||settings.playerName.trim()||(role==='host'?'Host':'Gast')
  const channelRef=useRef<RealtimeChannel|null>(null)
  const seqRef=useRef(Date.now()*1000+Math.floor(Math.random()*1000)); const lastRemoteSeqRef=useRef<Record<string,number>>({})
  const initialMe=restored?.me??{...createPlayer(initialName),id:clientId}; initialMe.id=clientId

  const [connected,setConnected]=useState(false); const [reconnecting,setReconnecting]=useState(false); const [peers,setPeers]=useState<Participant[]>([])
  const [participants,setParticipants]=useState<Participant[]>(restored?.participants??[]); const [started,setStarted]=useState(restored?.started??false)
  const [gameId,setGameId]=useState(restored?.gameId??'')
  const [me,setMe]=useState<PlayerState>(initialMe); const [opponents,setOpponents]=useState<Record<string,PlayerState>>(restored?.opponents??{})
  const [confetti,setConfetti]=useState(false); const [lobbyName,setLobbyName]=useState(initialName); const [remoteRolling,setRemoteRolling]=useState<Record<string,boolean>>({})
  const [syncing,setSyncing]=useState(false); const [incompatiblePeers,setIncompatiblePeers]=useState(0); const [connectionIssue,setConnectionIssue]=useState('')

  const meRef=useRef(me); const opponentsRef=useRef(opponents); const participantsRef=useRef(participants); const startedRef=useRef(started); const gameIdRef=useRef(gameId)
  useEffect(()=>{meRef.current=me},[me]); useEffect(()=>{opponentsRef.current=opponents},[opponents]); useEffect(()=>{participantsRef.current=participants},[participants]); useEffect(()=>{startedRef.current=started},[started]); useEffect(()=>{gameIdRef.current=gameId},[gameId])

  const orderedStates=useMemo(()=>participants.map(p=>p.clientId===clientId?me:opponents[p.clientId]),[participants,clientId,me,opponents])
  const tableState=useMemo(()=>deriveTurnState(orderedStates),[orderedStates])
  const currentRound=tableState.round
  const currentTurnIndex=tableState.turnIndex
  const protocolSafe=incompatiblePeers===0
  const finished=started && protocolSafe && tableState.ready && tableState.valid && tableState.finished
  const activeParticipant=participants[currentTurnIndex]??participants[0]
  const isMyTurn=Boolean(started&&protocolSafe&&tableState.ready&&tableState.valid&&!finished&&activeParticipant?.clientId===clientId)
  const activeRemote=activeParticipant&&activeParticipant.clientId!==clientId?opponents[activeParticipant.clientId]:undefined

  useEffect(()=>{saveSession(normalizedCode,role,{version:5,started,gameId,me,opponents,participants,savedAt:Date.now()})},[normalizedCode,role,started,gameId,me,opponents,participants])

  const nextSeq=useCallback(()=>++seqRef.current,[])
  const send=useCallback(async(message:GameMessageBody)=>{const channel=channelRef.current;if(!channel)return false;try{const payload:GameMessage={...message,protocol:MULTIPLAYER_PROTOCOL};const result=await channel.send({type:'broadcast',event:'game',payload});return result==='ok'}catch{return false}},[])
  const sendState=useCallback((player=meRef.current)=>{const id=gameIdRef.current;if(!startedRef.current||!id)return;void send({type:'state',sender:clientId,gameId:id,player:snapshot(player),seq:nextSeq()})},[clientId,nextSeq,send])
  const sendStateReliable=useCallback((player:PlayerState)=>{
    const attempt=async(tryIndex:number)=>{
      const id=gameIdRef.current;if(!startedRef.current||!id)return
      const ok=await send({type:'state',sender:clientId,gameId:id,player:snapshot(player),seq:nextSeq()})
      if(!ok&&tryIndex<3)window.setTimeout(()=>void attempt(tryIndex+1),180*(tryIndex+1))
    }
    void attempt(0)
  },[clientId,nextSeq,send])
  const sendFullSync=useCallback(()=>{const id=gameIdRef.current;if(!startedRef.current||!id)return;void send({type:'sync',sender:clientId,started:true,gameId:id,participants:participantsRef.current,player:snapshot(meRef.current),seq:nextSeq()})},[clientId,nextSeq,send])
  const sendAuthority=useCallback(()=>{const id=gameIdRef.current;const roster=participantsRef.current;if(role!=='host'||!startedRef.current||!id||hostOf(roster)!==clientId)return;void send({type:'authority',sender:clientId,gameId:id,participants:roster,player:snapshot(meRef.current),table:tableSnapshot(meRef.current,opponentsRef.current),seq:nextSeq()})},[clientId,nextSeq,role,send])
  const requestSync=useCallback(()=>{void send({type:'sync_request',sender:clientId,gameId:gameIdRef.current||undefined,seq:nextSeq()})},[clientId,nextSeq,send])

  const updatePresenceName=useCallback(async(name:string)=>{const clean=name.trim().slice(0,16)||(role==='host'?'Host':'Gast');setLobbyName(clean);setMe(p=>{const next={...p,name:clean,id:clientId};meRef.current=next;return next});const channel=channelRef.current;if(channel&&connected){try{await channel.track({clientId,name:clean,role,protocol:MULTIPLAYER_PROTOCOL,appVersion:APP_VERSION,joinedAt:Date.now()})}catch{}}},[clientId,connected,role])

  useEffect(()=>{
    const client=supabase;if(!realtimeConfigured||!client)return
    let disposed=false
    const connectChannel=()=>{
      if(disposed)return
      if(channelRef.current)return
      setReconnecting(true);setConnectionIssue('')
      const channel=client.channel(`kniffli:${normalizedCode}`,{config:{private:false,presence:{key:clientId},broadcast:{self:false,ack:false}}});channelRef.current=channel
      channel.on('presence',{event:'sync'},()=>{if(channelRef.current!==channel)return;const state=channel.presenceState() as Record<string,Array<Record<string,unknown>>>;const list=Object.values(state).flat().map(p=>({clientId:String(p.clientId??''),name:String(p.name??'Spieler').slice(0,16),role:(String(p.role??'guest')==='host'?'host':'guest') as 'host'|'guest',protocol:Number(p.protocol??0)}));const unique=uniqueParticipants(list);setIncompatiblePeers(unique.filter(p=>p.clientId!==clientId&&p.protocol!==MULTIPLAYER_PROTOCOL).length);setPeers(unique.filter(p=>p.protocol===MULTIPLAYER_PROTOCOL))})
      .on('broadcast',{event:'game'},({payload})=>{
        const msg=payload as GameMessage;if(!msg||msg.sender===clientId)return;if(msg.protocol!==MULTIPLAYER_PROTOCOL)return
        const last=lastRemoteSeqRef.current[msg.sender]??0;if('seq'in msg&&msg.seq<=last&&msg.type!=='sync_request')return;if('seq'in msg&&msg.type!=='sync_request')lastRemoteSeqRef.current[msg.sender]=msg.seq

        if(msg.type==='sync_request'){ if(!msg.gameId || !gameIdRef.current || msg.gameId===gameIdRef.current) sendFullSync(); return }
        if(msg.type==='start'){
          const roster=uniqueParticipants(msg.participants);if(hostOf(roster)!==msg.sender)return;setParticipants(roster);participantsRef.current=roster;setGameId(msg.gameId);gameIdRef.current=msg.gameId;setStarted(true);startedRef.current=true;setOpponents({});opponentsRef.current={};setRemoteRolling({});setSyncing(true);window.setTimeout(requestSync,80);return
        }
        if(msg.type==='rematch'){
          const roster=uniqueParticipants(msg.participants);if(hostOf(roster)!==msg.sender)return;const newMe={...createPlayer(meRef.current.name),id:clientId};meRef.current=newMe;setMe(newMe);opponentsRef.current={};setOpponents({});setParticipants(roster);participantsRef.current=roster;setGameId(msg.gameId);gameIdRef.current=msg.gameId;setRemoteRolling({});setStarted(true);startedRef.current=true;setSyncing(true);window.setTimeout(requestSync,80);return
        }
        if(msg.type==='authority'){
          const roster=uniqueParticipants(msg.participants);if(hostOf(roster)!==msg.sender)return
          const gameChanged=Boolean(gameIdRef.current&&gameIdRef.current!==msg.gameId)
          if(!roster.some(p=>p.clientId===clientId))return
          if(gameChanged){
            const newMe={...createPlayer(meRef.current.name),id:clientId};meRef.current=newMe;setMe(newMe);opponentsRef.current={};setOpponents({});setRemoteRolling({})
          }
          setParticipants(roster);participantsRef.current=roster;setGameId(msg.gameId);gameIdRef.current=msg.gameId;setStarted(true);startedRef.current=true
          const hostTable=msg.table&&typeof msg.table==='object'?msg.table:{}
          const myBackup=hostTable[clientId]
          if(!gameChanged&&myBackup){
            const recovered=mergePlayerSnapshot(meRef.current,remoteAsPlayer(myBackup));recovered.id=clientId
            if(filledCount(recovered.scoreCard)>filledCount(meRef.current.scoreCard)){meRef.current=recovered;setMe(recovered)}
          }
          setOpponents(prev=>{
            const next={...prev}
            for(const participant of roster){
              if(participant.clientId===clientId)continue
              const raw=hostTable[participant.clientId]??(participant.clientId===msg.sender?msg.player:undefined)
              if(!raw)continue
              const incoming=remoteAsPlayer(raw);incoming.id=participant.clientId
              next[participant.clientId]=mergePlayerSnapshot(next[participant.clientId],incoming,false)
            }
            opponentsRef.current=next;return next
          })
          setSyncing(true);window.setTimeout(requestSync,70);return
        }
        if(msg.type==='sync' && msg.started){
          const localGame=gameIdRef.current
          if(localGame && msg.gameId!==localGame) return
          if(!localGame){setGameId(msg.gameId);gameIdRef.current=msg.gameId}
          const roster=uniqueParticipants(msg.participants);if(roster.length&&hostOf(roster)===msg.sender){setParticipants(roster);participantsRef.current=roster}
          setStarted(true);startedRef.current=true
        }
        if(msg.type==='roster'){
          if(gameIdRef.current&&msg.gameId!==gameIdRef.current)return
          const roster=uniqueParticipants(msg.participants);if(hostOf(roster)!==msg.sender)return;setParticipants(roster);participantsRef.current=roster;return
        }
        if('gameId'in msg && gameIdRef.current && msg.gameId!==gameIdRef.current)return
        if(msg.type==='rolling'){setRemoteRolling(prev=>({...prev,[msg.sender]:msg.rolling}));return}
        if(msg.type!=='state'&&msg.type!=='sync')return
        const incomingPlayer=remoteAsPlayer(msg.player);incomingPlayer.id=msg.sender
        setOpponents(prev=>{const next={...prev,[msg.sender]:mergePlayerSnapshot(prev[msg.sender],incomingPlayer)};opponentsRef.current=next;return next})
        setSyncing(false)
      })
      .subscribe(async (status,error)=>{if(disposed||channelRef.current!==channel)return;if(status==='SUBSCRIBED'){setConnected(true);setReconnecting(false);setConnectionIssue('');try{await channel.track({clientId,name:meRef.current.name,role,protocol:MULTIPLAYER_PROTOCOL,appVersion:APP_VERSION,joinedAt:Date.now()});if(startedRef.current){sendFullSync();sendAuthority();window.setTimeout(requestSync,100)}}catch(trackError){setConnectionIssue(`Presence konnte nicht aktiviert werden: ${trackError instanceof Error?trackError.message:'unbekannter Fehler'}`)}}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){setConnected(false);setReconnecting(true);setConnectionIssue(error?.message||`${status}: Supabase verbindet automatisch neu`);nudgeRealtimeConnection()}else if(status==='CLOSED'){setConnected(false);setReconnecting(true);setConnectionIssue(error?.message||'Realtime-Kanal geschlossen');nudgeRealtimeConnection()}})
    }
    let lastWakeAt=0;const wake=()=>{if(disposed)return;const now=Date.now();if(now-lastWakeAt<1200)return;lastWakeAt=now;setReconnecting(true);nudgeRealtimeConnection()};const visibility=()=>{if(document.visibilityState==='visible')wake()};const offline=()=>{setConnected(false);setReconnecting(true);setConnectionIssue('iPhone ist offline')}
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pageshow',wake);window.addEventListener('online',wake);window.addEventListener('offline',offline);connectChannel()
    return()=>{disposed=true;document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pageshow',wake);window.removeEventListener('online',wake);window.removeEventListener('offline',offline);const channel=channelRef.current;channelRef.current=null;if(channel)void client.removeChannel(channel)}
  },[clientId,nextSeq,normalizedCode,requestSync,role,sendAuthority,sendFullSync])

  // Every local gameplay mutation is broadcast immediately.
  useEffect(()=>{if(started)sendState(me)},[me.dice,me.rollsUsed,me.submitted,me.scoreCard,started,sendState])

  // Heartbeat snapshots make Broadcast effectively self-healing: if one score event is
  // missed or an iPhone sleeps, the next snapshot restores the correct score progress.
  useEffect(()=>{
    if(!started||!connected)return
    const timer=window.setInterval(()=>sendState(),HEARTBEAT_MS)
    return()=>window.clearInterval(timer)
  },[started,connected,sendState])

  // The host periodically republishes the canonical game id + roster. This heals a
  // missed START/REMATCH broadcast and prevents clients from being stranded on an old game.
  useEffect(()=>{
    if(!started||!connected||role!=='host')return
    sendAuthority()
    const timer=window.setInterval(sendAuthority,AUTHORITY_HEARTBEAT_MS)
    return()=>window.clearInterval(timer)
  },[started,connected,role,sendAuthority])

  // If received score-card progress is impossible for sequential play, do not guess.
  // Ask every peer for its latest snapshot until the deterministic state becomes valid.
  useEffect(()=>{
    if(!started||!connected||!tableState.ready||tableState.valid)return
    setSyncing(true);requestSync();const timer=window.setTimeout(requestSync,450);return()=>window.clearTimeout(timer)
  },[started,connected,tableState.ready,tableState.valid,tableState.counts.join(','),requestSync])

  // When the deterministic state says it is this player's turn again, clear only their
  // dice/round controls. Score cards are never synthesized on another device.
  useEffect(()=>{
    if(!isMyTurn||finished||!tableState.valid||me.scoreCard==null)return
    if(me.submitted){
      const next=resetRound(me);meRef.current=next;setMe(next);setRemoteRolling(prev=>({...prev,[clientId]:false}))
    }
  },[isMyTurn,finished,tableState.valid,currentRound,me.submitted,clientId])

  const activeParticipantIds=useMemo(()=>participants.map(p=>p.clientId),[participants])
  const activeOpponents=useMemo(()=>activeParticipantIds.filter(id=>id!==clientId).map(id=>opponents[id]).filter((p):p is PlayerState=>Boolean(p)),[activeParticipantIds,clientId,opponents])
  const selfPresence:Participant={clientId,name:me.name,role,protocol:MULTIPLAYER_PROTOCOL};const lobbyPlayers=uniqueParticipants([selfPresence,...peers.filter(p=>p.clientId!==clientId)]).slice(0,MAX_PLAYERS);const playerCount=lobbyPlayers.length
  const shareUrl=`${location.origin}${location.pathname}?room=${encodeURIComponent(normalizedCode)}`;const roomFull=!started&&playerCount>=MAX_PLAYERS;const isParticipant=!started||participants.some(p=>p.clientId===clientId)
  const avatarHue=(index:number)=>['red','blue','gold','violet'][index % 4]
  const copyCode=async()=>{try{await navigator.clipboard.writeText(normalizedCode);softVibrate(10)}catch{}};const shareRoom=async()=>{const data={title:'Schmiddi & Schreier Dice Dash',text:`Komm in meine Dice-Dash-Lobby. Raum: ${normalizedCode}`,url:shareUrl};try{if(navigator.share)await navigator.share(data);else await navigator.clipboard.writeText(shareUrl)}catch{}}
  const start=async()=>{const roster=uniqueParticipants([selfPresence,...peers.filter(p=>p.clientId!==clientId)]).slice(0,MAX_PLAYERS);if(roster.length<2)return;const newGameId=uid();const newMe={...createPlayer(meRef.current.name),id:clientId};meRef.current=newMe;setMe(newMe);setOpponents({});opponentsRef.current={};setParticipants(roster);participantsRef.current=roster;setGameId(newGameId);gameIdRef.current=newGameId;setStarted(true);startedRef.current=true;setSyncing(true);await send({type:'start',sender:clientId,participants:roster,gameId:newGameId,seq:nextSeq()});window.setTimeout(()=>{sendState(newMe);sendAuthority();requestSync()},100)}
  const roll=()=>{if(!isMyTurn||me.submitted||me.rollsUsed>=3||!tableState.valid)return;softVibrate(12);setMe(p=>{const next=rollDice(p);meRef.current=next;return next});const id=gameIdRef.current;if(id)void send({type:'rolling',sender:clientId,gameId:id,rolling:false,seq:nextSeq()})}
  const rollStart=()=>{if(!isMyTurn||!tableState.valid)return;const id=gameIdRef.current;if(id)void send({type:'rolling',sender:clientId,gameId:id,rolling:true,seq:nextSeq()})}
  const score=(category:ScoreCategory)=>{if(!isMyTurn||!tableState.valid)return;const points=scoreCategory(category,me.dice.map(d=>d.value),me.rollsUsed);if(points===0&&!window.confirm('Dieses Feld mit 0 Punkten streichen?'))return;const result=submitCategory(me,category);if(result.player===me)return;meRef.current=result.player;setMe(result.player);sendStateReliable(result.player);playScoreTone(settings.sound,category==='kniffli'&&result.points>=50);softVibrate(category==='kniffli'&&result.points>=50?[25,40,25]:18);if(category==='kniffli'&&result.points>=50){setConfetti(true);window.setTimeout(()=>setConfetti(false),1800)}}
  const rematch=()=>{if(role!=='host')return;const roster=participantsRef.current;const newGameId=uid();const newMe={...createPlayer(meRef.current.name),id:clientId};meRef.current=newMe;setMe(newMe);opponentsRef.current={};setOpponents({});setGameId(newGameId);gameIdRef.current=newGameId;setRemoteRolling({});setStarted(true);startedRef.current=true;setSyncing(true);void send({type:'rematch',sender:clientId,gameId:newGameId,participants:roster,seq:nextSeq()});window.setTimeout(()=>{sendState(newMe);sendAuthority();requestSync()},120)}

  if(!realtimeConfigured)return <main className="screen-shell setup-error"><button className="icon-button" onClick={onExit}><ChevronLeft/></button><h1>Online-Modus noch nicht verbunden.</h1><p>Trage in Netlify die beiden Supabase-Variablen aus <code>.env.example</code> ein.</p></main>
  if(!started)return <main className="online-lobby screen-shell dice-dash-screen"><header className="simple-header lobby-topbar"><button className="icon-button neon" onClick={onExit}><ChevronLeft/></button><img className="lobby-logo-mini" src="/brand/dice-dash-logo.png" alt="Dice Dash"/><span className="connection lobby-connection">{connected?<><Wifi size={15}/> verbunden</>:<><WifiOff size={15}/>{reconnecting?' verbindet neu …':' verbindet …'}</>}</span></header><section className="dash-lobby-card"><span className="eyebrow dash-lobby-kicker">ONLINE-LOBBY</span><div className="dash-room-card"><small>RAUMCODE</small><div className="dash-room-code-row"><strong>{normalizedCode}</strong><button onClick={copyCode} aria-label="Code kopieren"><Copy/></button></div><button className="dash-share-button" onClick={shareRoom}><Share2/> Einladen</button></div>{connectionIssue&&<div className="waiting-banner connection-diagnostic"><b>Realtime:</b> {connectionIssue}<br/><small>Projekt: {supabaseProjectHost||'unbekannt'} · Prüfe in Supabase → Realtime Settings: Realtime aktiviert + Public Channels erlaubt.</small></div>}<label className="lobby-name-field dash-name-card"><span>DEIN NAME</span><input value={lobbyName} maxLength={16} onChange={e=>setLobbyName(e.target.value)} onBlur={()=>void updatePresenceName(lobbyName)} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}/></label><div className="dash-player-list">{lobbyPlayers.map((p,index)=><div className="dash-player-row" key={p.clientId}><div className={`dash-player-avatar ${avatarHue(index)}`}>{p.name.slice(0,1).toUpperCase()}</div><div className="dash-player-info"><b>{p.name}</b><small>{p.role==='host'?'HOST':p.clientId===clientId?'DU':`SPIELER ${index+1}`}</small></div>{p.role==='host'&&<Crown size={14} className="dash-host-crown"/>}<span className="dash-ready-badge">BEREIT</span></div>)}</div><div className="dash-lobby-footer"><div className="connection"><Users size={16}/><span>{playerCount}/{MAX_PLAYERS} verbunden</span></div>{roomFull&&<p className="micro-copy">Raum voll · maximal 4 Spieler.</p>}</div>{incompatiblePeers>0&&<div className="waiting-banner">⚠️ {incompatiblePeers} Spieler nutzt eine ältere App-Version. Auf allen iPhones App schließen und neu öffnen.</div>}{role==='host'?<button className="primary-button dash-start-button" disabled={!connected||playerCount<2||incompatiblePeers>0} onClick={start}>SPIEL STARTEN</button>:<div className="waiting-pulse"><i/><span>Warte auf Host …</span></div>}<div className="dash-connected-line"><span className={connected?'status-dot done':'status-dot'} /> <span>{connected?'VERBUNDEN':'VERBINDET ...'}</span></div><p className="micro-copy">Turn-based: Nur eine Person würfelt. Alle anderen sehen den Wurf live.</p></section></main>
  if(!isParticipant)return <main className="online-lobby screen-shell"><button className="icon-button" onClick={onExit}><ChevronLeft/></button><span className="eyebrow">RAUM #{normalizedCode}</span><h1>Match läuft bereits.</h1><p>Dieser Raum ist bereits gestartet oder voll.</p></main>

  const orderedPlayers=orderedStates.filter((p):p is PlayerState=>Boolean(p))
  if(finished)return <ResultScreen players={orderedPlayers} onRematch={role==='host'?rematch:undefined} rematchHint="Warte, bis der Host die Revanche startet." onHome={onExit}/>
  const activeName=activeParticipant?.name??'Spieler';const activePlayerOnline=Boolean(activeParticipant?.clientId===clientId||peers.some(p=>p.clientId===activeParticipant?.clientId));const turnPosition=`${Math.min(currentTurnIndex+1,participants.length)}/${participants.length}`
  const stateReady=protocolSafe&&tableState.ready&&tableState.valid
  return <main className="game-screen screen-shell dice-dash-screen"><Confetti active={confetti}/><header className="game-header multiplayer-header"><button className="icon-button" onClick={onExit}><ChevronLeft/></button><div className="round-badge"><small>RUNDE</small><strong>{currentRound}</strong></div><div className="multiplayer-score-strip">{orderedPlayers.map(p=><div key={p.id} className={`top-score ${p.id===activeParticipant?.clientId?'current-turn':''}`}><small>{p.id===clientId?'DU':p.name}</small><strong>{scoreTotals(p.scoreCard).total}</strong></div>)}</div></header><div className="game-brand-strip dash-brand-strip"><img src="/brand/dice-dash-logo.png" alt="Schmiddi &amp; Schreier Dice Dash"/><span><b>SCHMIDDI &amp; SCHREIER</b><small>DICE DASH · {filledCount(me.scoreCard)}/{TOTAL_ROUNDS} FELDER · {participants.length} SPIELER</small></span></div><div className="turn-banner"><div><small>ZUG {turnPosition}</small><strong>{!stateReady?'SPIELSTAND WIRD ABGEGLICHEN':isMyTurn?'DU BIST DRAN':`${activeName} IST DRAN`}</strong></div><span>{!stateReady?'Kurz warten · fehlende Snapshots werden automatisch nachgeladen':isMyTurn?'Würfeln · halten · eintragen':'Du schaust live zu'}</span></div><div className="game-progress"><span style={{width:`${Math.round((filledCount(me.scoreCard)/TOTAL_ROUNDS)*100)}%`}}/></div><div className="cpu-strip online-strip"><span className={connected&&stateReady?'status-dot done':'status-dot'}/><span><b>{connected?(stateReady?'LIVE':'SYNC'):'RECONNECT'}</b> · Reihenfolge: {participants.map((p,i)=>`${stateReady&&i===currentTurnIndex?'▶ ':''}${p.name}`).join(' · ')}</span><span className="room-mini">#{normalizedCode}</span></div>
    {!stateReady?<div className="waiting-banner">Spielstände werden synchronisiert …</div>:isMyTurn?<DiceTray dice={me.dice} rollsUsed={me.rollsUsed} submitted={me.submitted} sound={settings.sound} onRoll={roll} onRollStart={rollStart} onToggle={id=>setMe(p=>{const next=toggleDie(p,id);meRef.current=next;return next})}/>:activeRemote?<SpectatorDiceTray player={activeRemote} rolling={Boolean(remoteRolling[activeParticipant.clientId])}/>:<div className="waiting-banner">Spielstand von {activeName} wird synchronisiert …</div>}
    {stateReady&&!isMyTurn&&<div className="waiting-banner spectator-wait">Bitte warten · {activeName} ist dran. Der Zug wechselt automatisch, sobald dessen Score gespeichert ist.</div>}{incompatiblePeers>0&&<div className="waiting-banner">⚠️ Unterschiedliche App-Versionen erkannt. Auf allen iPhones App vollständig schließen und neu öffnen.</div>}{stateReady&&!isMyTurn&&!activePlayerOnline&&<div className="waiting-banner">{activeName} ist gerade offline. Der Zug bleibt sicher gespeichert und läuft nach dem Reconnect weiter.</div>}{syncing&&<div className="waiting-banner">Live-Sync aktiv · verpasste Events werden automatisch nachgezogen</div>}{!connected&&<div className="waiting-banner">Verbindung kurz weg · dein Spielstand bleibt gespeichert{connectionIssue?<><br/><small>{connectionIssue}</small></>:null}</div>}
    <ScoreSheet me={me} opponents={activeOpponents} myLabel="DU" allowScoring={isMyTurn&&stateReady} onScore={score}/></main>
}
