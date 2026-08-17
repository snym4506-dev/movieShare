import { useEffect, useRef, useState } from 'react';
import {
  Monitor,
  MonitorOff,
  Copy,
  Check,
  Users,
  LogOut,
  Film,
  Wifi,
  WifiOff,
  ScreenShare,
} from 'lucide-react';
import { WatchPartyRTC, type StreamState, type PeerInfo } from '@/lib/webrtc';
import { useChat } from '@/hooks/useChat';
import { ChatPanel } from './ChatPanel';
import type { Room as RoomType } from '@/types';

interface RoomProps {
  room: RoomType;
  myName: string;
  isHost: boolean;
  onLeave: () => void;
}

export function Room({ room, myName, isHost, onLeave }: RoomProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rtcRef = useRef<WatchPartyRTC | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState('');

  const { messages, loading, sendMessage, sendError } = useChat(room.id);

  useEffect(() => {
    const peerId = crypto.randomUUID();
    const rtc = new WatchPartyRTC(peerId, myName, room.code, isHost);
    rtcRef.current = rtc;

    const offStream = rtc.onStream((s) => setStream(s));
    const offPeers = rtc.onPeers((p) => setPeers(p));
    const offState = rtc.onState((st) => setStreamState(st));

    rtc.start();

    return () => {
      offStream();
      offPeers();
      offState();
      rtc.destroy();
      rtcRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.code, myName, isHost]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleShare = async () => {
    setShareError('');
    try {
      await rtcRef.current?.startScreenShare();
    } catch {
      setShareError('Screen share was cancelled or blocked. Please try again.');
    }
  };

  const handleStop = () => {
    rtcRef.current?.stopScreenShare();
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const stateLabel: Record<StreamState, string> = {
    idle: 'No stream',
    connecting: 'Connecting…',
    streaming: 'Live',
    error: 'Error',
  };

  const stateColor: Record<StreamState, string> = {
    idle: 'bg-white/20',
    connecting: 'bg-amber-400 animate-pulse',
    streaming: 'bg-emerald-400',
    error: 'bg-rose-500',
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-white">
      {/* top bar */}
      <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-white/10 bg-[#0f0f17]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight hidden sm:block">CineSync</span>
        </div>

        <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

        {/* room code */}
        <button
          onClick={copyCode}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
        >
          <span className="text-xs text-white/40">Room</span>
          <span className="font-mono font-semibold tracking-widest text-amber-300">{room.code}</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition" />
          )}
        </button>

        {/* status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className={`w-2 h-2 rounded-full ${stateColor[streamState]}`} />
          <span className="text-xs text-white/60 hidden sm:block">{stateLabel[streamState]}</span>
        </div>

        {/* viewers */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-xs text-white/60">{peers.length + 1}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-white/50 hidden md:block">
            {isHost ? 'Hosting as' : 'Watching as'} <span className="text-white/80 font-medium">{myName}</span>
          </span>
          <button
            onClick={onLeave}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Leave</span>
          </button>
        </div>
      </header>

      {/* body */}
      <div className="flex-1 flex overflow-hidden">
        {/* video area */}
        <div className="flex-1 flex flex-col p-4 md:p-6">
          <div className="relative flex-1 rounded-2xl overflow-hidden bg-black border border-white/10 group">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isHost}
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                  {isHost ? (
                    <Monitor className="w-9 h-9 text-white/30" />
                  ) : (
                    <WifiOff className="w-9 h-9 text-white/30" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white/80 mb-2">
                  {isHost ? 'Share your screen to start' : 'Waiting for host to share…'}
                </h3>
                <p className="text-white/40 text-sm max-w-sm text-center">
                  {isHost
                    ? 'Click "Start sharing" below to broadcast your screen to everyone in the room.'
                    : 'The stream will appear here automatically once the host starts sharing.'}
                </p>
              </div>
            )}

            {/* live badge */}
            {stream && streamState === 'streaming' && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-semibold text-white">LIVE</span>
              </div>
            )}

            {/* viewer list overlay */}
            {peers.length > 0 && (
              <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
                {peers.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-[10px] font-bold">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-white/80">{p.name}</span>
                    {p.isHost && <span className="text-[9px] text-amber-400 font-semibold">HOST</span>}
                  </div>
                ))}
                {peers.length > 5 && (
                  <span className="text-xs text-white/40 px-2">+{peers.length - 5} more</span>
                )}
              </div>
            )}
          </div>

          {/* controls */}
          <div className="mt-4 flex items-center gap-3">
            {isHost && (
              <>
                {stream ? (
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold hover:bg-rose-500/25 transition"
                  >
                    <MonitorOff className="w-5 h-5" />
                    Stop sharing
                  </button>
                ) : (
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition"
                  >
                    <ScreenShare className="w-5 h-5" />
                    Start sharing
                  </button>
                )}
              </>
            )}

            {!isHost && streamState === 'connecting' && (
              <div className="flex items-center gap-2 px-4 py-3 text-amber-300/80 text-sm">
                <Wifi className="w-4 h-4 animate-pulse" />
                Connecting to host…
              </div>
            )}

            {!isHost && !stream && streamState !== 'connecting' && (
              <div className="flex items-center gap-2 px-4 py-3 text-white/40 text-sm">
                <WifiOff className="w-4 h-4" />
                Waiting for host
              </div>
            )}

            {shareError && (
              <p className="text-sm text-rose-400">{shareError}</p>
            )}

            <div className="ml-auto text-xs text-white/30 hidden md:block">
              {isHost
                ? 'Your screen is visible to everyone in the room.'
                : 'You can only watch — ask the host to share their screen.'}
            </div>
          </div>
        </div>

        {/* chat sidebar */}
        <aside className="w-80 md:w-96 flex-shrink-0 hidden sm:flex">
          <ChatPanel
            messages={messages}
            loading={loading}
            onSend={(c) => sendMessage(myName, c)}
            myName={myName}
            sendError={sendError}
          />
        </aside>
      </div>
    </div>
  );
}
