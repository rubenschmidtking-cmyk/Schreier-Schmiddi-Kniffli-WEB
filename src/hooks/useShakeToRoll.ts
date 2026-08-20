import { useEffect, useRef } from 'react'

type DeviceMotionEventIOS = typeof DeviceMotionEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }

export async function requestMotionPermission() {
  const ctor = DeviceMotionEvent as DeviceMotionEventIOS
  if (typeof ctor?.requestPermission === 'function') {
    try { return (await ctor.requestPermission()) === 'granted' } catch { return false }
  }
  return true
}

export function useShakeToRoll(enabled: boolean, onShake: () => void) {
  const lastShake = useRef(0)
  const callback = useRef(onShake)
  callback.current = onShake

  useEffect(() => {
    if (!enabled) return
    const handler = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity
      if (!a || a.x == null || a.y == null || a.z == null) return
      const magnitude = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z)
      const now = Date.now()
      if (magnitude > 24 && now - lastShake.current > 900) {
        lastShake.current = now
        callback.current()
      }
    }
    window.addEventListener('devicemotion', handler)
    return () => window.removeEventListener('devicemotion', handler)
  }, [enabled])
}
