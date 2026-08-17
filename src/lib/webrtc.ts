import { supabase } from './supabase';

export type StreamState = 'idle' | 'connecting' | 'streaming' | 'error';

export interface SignalPayload {
  to: string;
  from: string;
  type: 'offer' | 'answer' | 'ice';
  data: unknown;
}

export interface PeerInfo {
  id: string;
  name: string;
  isHost: boolean;
}

type Listener = (stream: MediaStream | null) => void;
type PeerListener = (peers: PeerInfo[]) => void;
type StateListener = (state: StreamState) => void;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export class WatchPartyRTC {
  private peerId: string;
  private peerName: string;
  private roomCode: string;
  private isHost: boolean;
  private channel: ReturnType<typeof supabase.channel> | null = null;

  private screenStream: MediaStream | null = null;
  private connections = new Map<string, RTCPeerConnection>();
  private remoteStream: MediaStream | null = null;

  private peers = new Map<string, PeerInfo>();
  private streamListeners = new Set<Listener>();
  private peerListeners = new Set<PeerListener>();
  private stateListeners = new Set<StateListener>();

  private state: StreamState = 'idle';

  constructor(peerId: string, peerName: string, roomCode: string, isHost: boolean) {
    this.peerId = peerId;
    this.peerName = peerName;
    this.roomCode = roomCode;
    this.isHost = isHost;
  }

  get myId() {
    return this.peerId;
  }

  get amHost() {
    return this.isHost;
  }

  onStream(fn: Listener) {
    this.streamListeners.add(fn);
    return () => this.streamListeners.delete(fn);
  }

  onPeers(fn: PeerListener) {
    this.peerListeners.add(fn);
    return () => this.peerListeners.delete(fn);
  }

  onState(fn: StateListener) {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }

  private emitStream() {
    this.streamListeners.forEach((fn) => fn(this.remoteStream));
  }

  private emitPeers() {
    const list = Array.from(this.peers.values());
    this.peerListeners.forEach((fn) => fn(list));
  }

  private setState(s: StreamState) {
    this.state = s;
    this.stateListeners.forEach((fn) => fn(s));
  }

  getState() {
    return this.state;
  }

  async start() {
    this.channel = supabase.channel(`room-${this.roomCode}`, {
      config: { broadcast: { self: false }, presence: { key: this.peerId } },
    });

    this.channel
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        const msg = payload as SignalPayload;
        if (msg.to !== this.peerId) return;
        this.handleSignal(msg);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel!.presenceState();
        const newPeers = new Map<string, PeerInfo>();
        for (const [id, metas] of Object.entries(state)) {
          if (id === this.peerId) continue;
          const meta = metas[0] as unknown as PeerInfo;
          if (meta) newPeers.set(id, { ...meta, id });
        }

        const oldIds = new Set(this.peers.keys());
        const newIds = new Set(newPeers.keys());

        for (const id of oldIds) {
          if (!newIds.has(id)) {
            this.peers.delete(id);
            this.closeConnection(id);
          }
        }
        for (const [id, info] of newPeers) {
          if (!oldIds.has(id)) {
            this.peers.set(id, info);
            if (this.isHost && this.screenStream) {
              this.initiateConnection(id);
            }
          } else {
            this.peers.set(id, info);
          }
        }
        this.emitPeers();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel!.track({
            id: this.peerId,
            name: this.peerName,
            isHost: this.isHost,
          } as PeerInfo);
        }
      });
  }

  private async handleSignal(msg: SignalPayload) {
    const fromId = msg.from;
    let pc = this.connections.get(fromId);

    if (msg.type === 'offer') {
      if (!pc) {
        pc = this.createPeerConnection(fromId);
        this.connections.set(fromId, pc);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(msg.data as RTCSessionDescriptionInit));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendSignal(fromId, 'answer', answer);
    } else if (msg.type === 'answer') {
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.data as RTCSessionDescriptionInit));
      }
    } else if (msg.type === 'ice') {
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(msg.data as RTCIceCandidateInit));
        } catch {
          /* candidate may arrive before description */
        }
      }
    }
  }

  private sendSignal(to: string, type: SignalPayload['type'], data: unknown) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: { to, from: this.peerId, type, data } as SignalPayload,
    });
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    if (this.isHost && this.screenStream) {
      for (const track of this.screenStream.getTracks()) {
        pc.addTrack(track, this.screenStream);
      }
    }

    pc.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      for (const track of event.streams[0].getTracks()) {
        this.remoteStream.addTrack(track);
      }
      this.emitStream();
      this.setState('streaming');
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(peerId, 'ice', event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.setState('connecting');
      }
    };

    return pc;
  }

  private async initiateConnection(peerId: string) {
    if (!this.isHost || !this.screenStream) return;
    const pc = this.createPeerConnection(peerId);
    this.connections.set(peerId, pc);
    this.setState('connecting');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.sendSignal(peerId, 'offer', offer);
  }

  async startScreenShare(): Promise<void> {
    if (!this.isHost) throw new Error('Only the host can share their screen');
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      this.screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenShare();
      });

      for (const [peerId] of this.connections) {
        this.closeConnection(peerId);
      }
      this.connections.clear();

      for (const [peerId] of this.peers) {
        this.initiateConnection(peerId);
      }

      this.remoteStream = this.screenStream;
      this.emitStream();
      this.setState('streaming');
    } catch (err) {
      this.setState('error');
      throw err;
    }
  }

  private closeConnection(peerId: string) {
    const pc = this.connections.get(peerId);
    if (pc) {
      pc.close();
      this.connections.delete(peerId);
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      for (const track of this.screenStream.getTracks()) {
        track.stop();
      }
      this.screenStream = null;
    }
    for (const [peerId] of this.connections) {
      this.closeConnection(peerId);
    }
    this.connections.clear();
    if (this.isHost) {
      this.remoteStream = null;
      this.emitStream();
      this.setState('idle');
    }
  }

  destroy() {
    this.stopScreenShare();
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.streamListeners.clear();
    this.peerListeners.clear();
    this.stateListeners.clear();
  }
}
