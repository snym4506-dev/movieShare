/*
# Enable realtime for rooms and messages tables

1. Changes
- Add `public.rooms` and `public.messages` to the `supabase_realtime` publication.
- This allows the Supabase Realtime engine to broadcast INSERT/UPDATE/DELETE events
  for these tables, which the chat feature depends on.

2. Security
- No RLS or policy changes. Realtime respects existing RLS policies — only rows
  the client is allowed to SELECT will be broadcast to them.
*/

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
