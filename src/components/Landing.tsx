import { useState } from 'react';
import { Film, Monitor, Users, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';

interface LandingProps {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (name: string, code: string) => void;
}

export function Landing({ onCreateRoom, onJoinRoom }: LandingProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter your name first');
      return;
    }
    if (!code.trim()) {
      setError('Enter a room code');
      return;
    }
    setError('');
    onJoinRoom(name.trim(), code.trim().toUpperCase());
  };

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Enter your name first');
      return;
    }
    setError('');
    onCreateRoom(name.trim());
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-rose-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-sky-500/10 blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 md:py-16">
        {/* nav */}
        <nav className="flex items-center justify-between mb-16 md:mb-24">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">CineSync</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-white/50">
            <Sparkles className="w-4 h-4" />
            Watch together, in sync
          </div>
        </nav>

        {/* hero */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-time screen sharing
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
              Watch movies
              <br />
              <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">
                with your friends
              </span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-md">
              Create a room, share your screen, and invite friends with a code.
              Chat live while you watch together — no downloads, no setup.
            </p>

            <div className="flex flex-wrap gap-6 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-rose-400" />
                Screen sharing
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Up to 10 viewers
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                Live chat
              </div>
            </div>
          </div>

          {/* card */}
          <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl shadow-black/40">
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-2">
                Your name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                maxLength={24}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-rose-400/50 focus:bg-white/10 transition"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCreate}
                className="w-full group flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition"
              >
                Create a room
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </button>

              <div className="flex items-center gap-3 text-xs text-white/30">
                <div className="h-px flex-1 bg-white/10" />
                or join an existing room
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleJoin} className="space-y-3">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Room code"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 uppercase tracking-widest text-center font-mono focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-white/20 transition"
                >
                  Join room
                </button>
              </form>
            </div>

            {error && (
              <p className="mt-4 text-sm text-rose-400 text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
