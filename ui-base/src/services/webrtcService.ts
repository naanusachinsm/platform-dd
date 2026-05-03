const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export type MediaKind = "audio" | "video";

class WebRTCService {
  private peerConnections = new Map<string, RTCPeerConnection>();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;

  private onRemoteStream: ((userId: string, stream: MediaStream) => void) | null = null;
  private onIceCandidate: ((userId: string, candidate: RTCIceCandidateInit) => void) | null = null;
  private onConnectionStateChange: ((userId: string, state: RTCPeerConnectionState) => void) | null = null;

  setCallbacks(callbacks: {
    onRemoteStream: (userId: string, stream: MediaStream) => void;
    onIceCandidate: (userId: string, candidate: RTCIceCandidateInit) => void;
    onConnectionStateChange?: (userId: string, state: RTCPeerConnectionState) => void;
  }) {
    this.onRemoteStream = callbacks.onRemoteStream;
    this.onIceCandidate = callbacks.onIceCandidate;
    this.onConnectionStateChange = callbacks.onConnectionStateChange ?? null;
  }

  async getLocalStream(callType: "audio" | "video"): Promise<MediaStream> {
    if (this.localStream) return this.localStream;

    const constraints: MediaStreamConstraints[] = [
      { audio: true, video: callType === "video" },
      { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: callType === "video" },
      { audio: true, video: false },
    ];

    for (const constraint of constraints) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia(constraint);
        return this.localStream;
      } catch {
        continue;
      }
    }

    throw new Error("No available media devices");
  }

  getExistingLocalStream(): MediaStream | null {
    return this.localStream;
  }

  async getScreenStream(): Promise<MediaStream> {
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    return this.screenStream;
  }

  stopScreenStream() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
  }

  createPeerConnection(remoteUserId: string): RTCPeerConnection {
    const existing = this.peerConnections.get(remoteUserId);
    if (existing) {
      existing.close();
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate?.(remoteUserId, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        this.onRemoteStream?.(remoteUserId, event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(remoteUserId, pc.connectionState);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    this.peerConnections.set(remoteUserId, pc);
    return pc;
  }

  async createOffer(remoteUserId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnections.get(remoteUserId) || this.createPeerConnection(remoteUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(
    remoteUserId: string,
    sdp: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeerConnection(remoteUserId);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(remoteUserId: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async addIceCandidate(remoteUserId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      // Candidate may arrive before remote description is set; safe to ignore
    }
  }

  toggleAudio(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }

  toggleVideo(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }

  async replaceVideoTrack(newTrack: MediaStreamTrack) {
    for (const pc of this.peerConnections.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
    }
  }

  closePeerConnection(remoteUserId: string) {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remoteUserId);
    }
  }

  cleanup() {
    for (const [userId, pc] of this.peerConnections) {
      pc.close();
      this.peerConnections.delete(userId);
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    this.stopScreenStream();
    this.onRemoteStream = null;
    this.onIceCandidate = null;
    this.onConnectionStateChange = null;
  }
}

export const webrtcService = new WebRTCService();
