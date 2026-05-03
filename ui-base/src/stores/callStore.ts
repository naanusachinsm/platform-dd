import { create } from "zustand";

export type CallState = "idle" | "calling" | "ringing" | "in-call";
export type CallType = "audio" | "video";

export interface CallParticipant {
  userId: string;
  userName: string;
  stream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
}

export interface IncomingCall {
  chatRoomId: string;
  callerId: string;
  callerName: string;
  callType: CallType;
}

interface CallStore {
  callState: CallState;
  callType: CallType;
  callChatRoomId: string | null;
  participants: CallParticipant[];
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  incomingCall: IncomingCall | null;
  callStartedAt: number | null;

  setCallState: (state: CallState) => void;
  setCallType: (type: CallType) => void;
  setCallChatRoomId: (id: string | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  setIsMuted: (muted: boolean) => void;
  setIsVideoOff: (off: boolean) => void;
  setIsScreenSharing: (sharing: boolean) => void;
  setIncomingCall: (call: IncomingCall | null) => void;

  addParticipant: (participant: CallParticipant) => void;
  removeParticipant: (userId: string) => void;
  setParticipantStream: (userId: string, stream: MediaStream) => void;
  updateParticipantMedia: (
    userId: string,
    kind: "audio" | "video",
    enabled: boolean
  ) => void;

  reset: () => void;
}

const initialState = {
  callState: "idle" as CallState,
  callType: "audio" as CallType,
  callChatRoomId: null as string | null,
  participants: [] as CallParticipant[],
  localStream: null as MediaStream | null,
  screenStream: null as MediaStream | null,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  incomingCall: null as IncomingCall | null,
  callStartedAt: null as number | null,
};

export const useCallStore = create<CallStore>()((set) => ({
  ...initialState,

  setCallState: (callState) =>
    set({
      callState,
      callStartedAt: callState === "in-call" ? Date.now() : undefined,
    }),
  setCallType: (callType) => set({ callType }),
  setCallChatRoomId: (callChatRoomId) => set({ callChatRoomId }),
  setLocalStream: (localStream) => set({ localStream }),
  setScreenStream: (screenStream) => set({ screenStream }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setIsVideoOff: (isVideoOff) => set({ isVideoOff }),
  setIsScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  setIncomingCall: (incomingCall) => set({ incomingCall }),

  addParticipant: (participant) =>
    set((state) => {
      if (state.participants.find((p) => p.userId === participant.userId)) {
        return state;
      }
      return { participants: [...state.participants, participant] };
    }),

  removeParticipant: (userId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.userId !== userId),
    })),

  setParticipantStream: (userId, stream) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.userId === userId ? { ...p, stream } : p
      ),
    })),

  updateParticipantMedia: (userId, kind, enabled) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.userId === userId
          ? {
              ...p,
              isMuted: kind === "audio" ? !enabled : p.isMuted,
              isVideoOff: kind === "video" ? !enabled : p.isVideoOff,
            }
          : p
      ),
    })),

  reset: () => set(initialState),
}));
