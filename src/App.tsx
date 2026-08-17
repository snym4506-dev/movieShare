import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { generateRoomCode } from '@/lib/roomCode';
import { Landing } from '@/components/Landing';
import { Room } from '@/components/Room';
import type { Room as RoomType } from '@/types';

type View = 'landing' | 'room';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [room, setRoom] = useState<RoomType | null>(null);
  const [myName, setMyName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleCreateRoom = useCallback(async (name: string) => {
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from('rooms')
      .insert({ code, host_name: name, active: true })
      .select()
      .single();

    if (error || !data) {
      setJoinError('Could not create room. Please try again.');
      return;
    }

    setMyName(name);
    setIsHost(true);
    setRoom(data as RoomType);
    setView('room');
  }, []);

  const handleJoinRoom = useCallback(async (name: string, code: string) => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      setJoinError('Could not reach the server. Please try again.');
      return;
    }
    if (!data) {
      setJoinError('No active room found with that code.');
      return;
    }

    setMyName(name);
    setIsHost(false);
    setRoom(data as RoomType);
    setView('room');
  }, []);

  const handleLeave = useCallback(() => {
    setView('landing');
    setRoom(null);
    setIsHost(false);
    setMyName('');
    setJoinError('');
  }, []);

  if (view === 'room' && room) {
    return (
      <Room
        room={room}
        myName={myName}
        isHost={isHost}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <>
      {joinError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm backdrop-blur-xl">
          {joinError}
        </div>
      )}
      <Landing onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
    </>
  );
}
