/*
# Create rooms and messages tables for watch party app

1. New Tables
- `rooms`
  - `id` (uuid, primary key)
  - `code` (text, unique short join code, e.g. "ABCD12")
  - `host_name` (text, display name of the room creator)
  - `active` (boolean, whether the room is currently live, default true)
  - `created_at` (timestamptz)
- `messages`
  - `id` (uuid, primary key)
  - `room_id` (uuid, foreign key to rooms, cascade delete)
  - `author_name` (text, display name of sender)
  - `content` (text, chat message body)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- No auth in this app, so policies allow anon + authenticated CRUD (intentionally public/shared data).
- rooms: anyone can create/read/update/delete (rooms are shared by code).
- messages: anyone can post/read/delete in a room.

3. Indexes
- Index on rooms.code for fast lookups by join code.
- Index on messages.room_id for fast chat history fetches.
*/

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  host_name text NOT NULL DEFAULT 'Host',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id, created_at);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_rooms" ON rooms;
CREATE POLICY "anon_select_rooms" ON rooms FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rooms" ON rooms;
CREATE POLICY "anon_insert_rooms" ON rooms FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rooms" ON rooms;
CREATE POLICY "anon_update_rooms" ON rooms FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rooms" ON rooms;
CREATE POLICY "anon_delete_rooms" ON rooms FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE
  TO anon, authenticated USING (true);
