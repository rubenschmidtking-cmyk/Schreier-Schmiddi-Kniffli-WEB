# V19 – Realtime connection fix

- Removed the competing manual remove/recreate reconnect loop.
- Supabase Realtime now owns WebSocket reconnect/backoff and channel rejoin.
- Public channel mode is explicit (`private: false`).
- Broadcast acknowledgements are disabled for gameplay events to reduce round-trip coupling.
- Realtime heartbeat interval is 15 seconds and uses a Web Worker.
- iOS resume/online events nudge the existing Realtime socket instead of destroying the channel.
- Lobby now shows the actual Supabase channel error and project hostname.
- Protocol bumped to 19 / app version 2.0.0 to prevent stale cached clients mixing with V18.

Required Supabase dashboard setting for this no-login multiplayer architecture:
Realtime must be enabled and public channels must be allowed. If public access is disabled, clients cannot join without Supabase Auth + Realtime RLS policies.
