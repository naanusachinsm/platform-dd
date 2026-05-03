import { useState, useEffect, useCallback } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useCallStore, type CallType } from "@/stores/callStore";
import { useAppStore } from "@/stores/appStore";
import { chatService } from "@/api/chatService";
import { getSocket, setOnConnectCallback } from "@/services/socket";
import { webrtcService } from "@/services/webrtcService";
import { toast } from "sonner";
import ChatSidebar from "./ChatSidebar";
import ChatArea from "./ChatArea";
import NewChatModal from "./NewChatModal";
import IncomingCallDialog from "./IncomingCallDialog";
import AddMembersDialogUI from "./AddMembersDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import type { ChatRoom, ChatMessage } from "@/api/chatTypes";

export default function ChatPage() {
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const {
    chatRooms,
    activeChatId,
    setActiveChatId,
    fetchChatRooms,
    fetchMessages,
    fetchUnreadCounts,
    addMessage,
    updateRoomPreview,
    incrementUnread,
    setTypingUser,
    removeTypingUser,
    clearUnread,
  } = useChatStore();
  const {
    callState,
    callChatRoomId,
    setCallState,
    setCallType,
    setCallChatRoomId,
    setLocalStream,
    setIncomingCall,
    addParticipant,
    removeParticipant,
    setParticipantStream,
    updateParticipantMedia,
    reset: resetCallStore,
  } = useCallStore();
  const user = useAppStore((s) => s.user);
  const currentUserId = user?.sub || user?.id;
  const currentUserName = user
    ? `${user.firstName} ${user.lastName}`
    : "Unknown";

  const activeChatRoom =
    chatRooms.find((r) => r.id === activeChatId) || null;

  useEffect(() => {
    fetchChatRooms();
    fetchUnreadCounts();
  }, [fetchChatRooms, fetchUnreadCounts]);

  useEffect(() => {
    if (chatRooms.length === 0) return;

    const socket = getSocket();
    const roomIds = chatRooms.map((r) => r.id);

    const joinRoomsAndRegister = () => {
      socket.emit("join-chat-rooms", roomIds);
      if (currentUserId) {
        socket.emit("register-user", currentUserId);
      }
    };

    joinRoomsAndRegister();
    setOnConnectCallback(joinRoomsAndRegister);

    const handleNewMessage = (data: {
      chatRoomId: string;
      message: ChatMessage;
    }) => {
      addMessage(data.chatRoomId, data.message);

      const preview =
        data.message.content.length > 100
          ? data.message.content.substring(0, 100) + "..."
          : data.message.content;
      updateRoomPreview(
        data.chatRoomId,
        preview,
        data.message.createdAt
      );

      const { activeChatId: currentActive } = useChatStore.getState();
      if (data.chatRoomId !== currentActive) {
        if (data.message.senderId !== currentUserId) {
          incrementUnread(data.chatRoomId);
        }
      } else {
        chatService.markAsRead(data.chatRoomId).catch(() => {});
      }
    };

    const handleUserTyping = (data: {
      chatRoomId: string;
      userId: string;
      userName: string;
    }) => {
      if (data.userId !== currentUserId) {
        setTypingUser(data.chatRoomId, data.userId, data.userName);
      }
    };

    const handleStopTyping = (data: {
      chatRoomId: string;
      userId: string;
    }) => {
      removeTypingUser(data.chatRoomId, data.userId);
    };

    const handleChatUpdated = () => {
      fetchChatRooms();
    };

    // --- Call signaling listeners ---

    const handleIncomingCall = (data: {
      chatRoomId: string;
      callerId: string;
      callerName: string;
      callType: CallType;
    }) => {
      const { callState: currentCallState } = useCallStore.getState();
      if (currentCallState !== "idle") return;
      setIncomingCall({
        chatRoomId: data.chatRoomId,
        callerId: data.callerId,
        callerName: data.callerName,
        callType: data.callType,
      });
    };

    const handleCallUserJoined = async (data: {
      chatRoomId: string;
      userId: string;
      userName: string;
      existingParticipants: string[];
    }) => {
      if (data.userId === currentUserId) return;

      addParticipant({
        userId: data.userId,
        userName: data.userName,
        stream: null,
        isMuted: false,
        isVideoOff: false,
      });

      const { callState: cs } = useCallStore.getState();
      if (cs === "calling") {
        setCallState("in-call");
      }
      if (cs !== "in-call" && cs !== "calling") return;

      const offer = await webrtcService.createOffer(data.userId);
      socket.emit("call-offer", {
        chatRoomId: data.chatRoomId,
        targetUserId: data.userId,
        sdp: offer,
        fromUserId: currentUserId,
      });
    };

    const handleCallOffer = async (data: {
      chatRoomId: string;
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      try {
        const { participants: pts } = useCallStore.getState();
        if (!pts.find((p) => p.userId === data.fromUserId)) {
          addParticipant({
            userId: data.fromUserId,
            userName: data.fromUserId,
            stream: null,
            isMuted: false,
            isVideoOff: false,
          });
        }

        const answer = await webrtcService.handleOffer(data.fromUserId, data.sdp);
        socket.emit("call-answer", {
          chatRoomId: data.chatRoomId,
          targetUserId: data.fromUserId,
          sdp: answer,
          fromUserId: currentUserId,
        });
      } catch (err) {
        console.error("Failed to handle call offer:", err);
      }
    };

    const handleCallAnswer = async (data: {
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      try {
        await webrtcService.handleAnswer(data.fromUserId, data.sdp);
      } catch (err) {
        console.error("Failed to handle call answer:", err);
      }
    };

    const handleCallIceCandidate = async (data: {
      fromUserId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      try {
        await webrtcService.addIceCandidate(data.fromUserId, data.candidate);
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    };

    const handleCallUserLeft = (data: { userId: string }) => {
      webrtcService.closePeerConnection(data.userId);
      removeParticipant(data.userId);

      const { participants: remaining, callChatRoomId: roomId } =
        useCallStore.getState();
      const stillInCall = remaining.filter((p) => p.userId !== data.userId);
      if (stillInCall.length === 0) {
        socket.emit("call-leave", {
          chatRoomId: roomId,
          userId: currentUserId,
        });
        webrtcService.cleanup();
        setLocalStream(null);
        setCallState("idle");
        resetCallStore();
        toast.info("Call ended");
      }
    };

    const handleCallEnded = () => {
      webrtcService.cleanup();
      setLocalStream(null);
      setCallState("idle");
      resetCallStore();
      toast.info("Call ended");
    };

    const handleCallRejected = (data: { userId: string }) => {
      toast.info("Call was declined");
      const { participants } = useCallStore.getState();
      if (participants.length === 0) {
        webrtcService.cleanup();
        setLocalStream(null);
        setCallState("idle");
        resetCallStore();
      }
    };

    const handleCallMediaToggled = (data: {
      userId: string;
      kind: "audio" | "video";
      enabled: boolean;
    }) => {
      updateParticipantMedia(data.userId, data.kind, data.enabled);
    };

    socket.on("new-message", handleNewMessage);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleStopTyping);
    socket.on("chat-updated", handleChatUpdated);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-user-joined", handleCallUserJoined);
    socket.on("call-offer", handleCallOffer);
    socket.on("call-answer", handleCallAnswer);
    socket.on("call-ice-candidate", handleCallIceCandidate);
    socket.on("call-user-left", handleCallUserLeft);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-media-toggled", handleCallMediaToggled);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleStopTyping);
      socket.off("chat-updated", handleChatUpdated);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-user-joined", handleCallUserJoined);
      socket.off("call-offer", handleCallOffer);
      socket.off("call-answer", handleCallAnswer);
      socket.off("call-ice-candidate", handleCallIceCandidate);
      socket.off("call-user-left", handleCallUserLeft);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-media-toggled", handleCallMediaToggled);
      for (const id of roomIds) {
        socket.emit("leave-chat-room", id);
      }
    };
  }, [
    chatRooms.length,
    currentUserId,
    addMessage,
    updateRoomPreview,
    incrementUnread,
    setTypingUser,
    removeTypingUser,
    fetchChatRooms,
    setIncomingCall,
    addParticipant,
    removeParticipant,
    setParticipantStream,
    updateParticipantMedia,
    setCallState,
    setLocalStream,
    resetCallStore,
  ]);

  useEffect(() => {
    webrtcService.setCallbacks({
      onRemoteStream: (userId, stream) => {
        setParticipantStream(userId, stream);
      },
      onIceCandidate: (userId, candidate) => {
        const socket = getSocket();
        const { callChatRoomId: roomId } = useCallStore.getState();
        if (!roomId) return;
        socket.emit("call-ice-candidate", {
          chatRoomId: roomId,
          targetUserId: userId,
          candidate,
          fromUserId: currentUserId,
        });
      },
    });
  }, [currentUserId, setParticipantStream]);

  const handleStartCall = useCallback(
    async (callType: CallType) => {
      if (!activeChatId || !currentUserId) return;
      const { callState: cs } = useCallStore.getState();
      if (cs !== "idle") return;

      setCallState("calling");
      setCallType(callType);
      setCallChatRoomId(activeChatId);

      try {
        const stream = await webrtcService.getLocalStream(callType);
        setLocalStream(stream);

        const socket = getSocket();
        socket.emit("call-initiate", {
          chatRoomId: activeChatId,
          userId: currentUserId,
          userName: currentUserName,
          callType,
        });
      } catch (err: any) {
        console.error("Media access error:", err);
        setCallState("idle");
        setCallChatRoomId(null);
        const msg =
          err?.name === "NotAllowedError"
            ? "Please allow microphone/camera access in your browser"
            : err?.name === "NotReadableError"
              ? "Microphone/camera is in use by another app or tab"
              : "Could not access camera/microphone";
        toast.error(msg);
      }
    },
    [
      activeChatId,
      currentUserId,
      currentUserName,
      setLocalStream,
      setCallType,
      setCallChatRoomId,
      setCallState,
    ]
  );

  const handleAcceptCall = useCallback(async () => {
    const { incomingCall } = useCallStore.getState();
    if (!incomingCall || !currentUserId) return;

      try {
        let stream: MediaStream | null = null;
        try {
          stream = await webrtcService.getLocalStream(incomingCall.callType);
        } catch (mediaErr: any) {
          console.error("Media access error:", mediaErr);
          const msg =
            mediaErr?.name === "NotAllowedError"
              ? "Please allow microphone/camera access in your browser"
              : mediaErr?.name === "NotReadableError"
                ? "Microphone/camera is in use by another tab. Joining as listener."
                : "Could not access camera/microphone. Joining as listener.";
          toast.error(msg);
        }

      setLocalStream(stream);
      setCallType(incomingCall.callType);
      setCallChatRoomId(incomingCall.chatRoomId);

      addParticipant({
        userId: incomingCall.callerId,
        userName: incomingCall.callerName,
        stream: null,
        isMuted: false,
        isVideoOff: false,
      });

      setActiveChatId(incomingCall.chatRoomId);
      setIncomingCall(null);
      setCallState("in-call");

      const socket = getSocket();
      socket.emit("call-join", {
        chatRoomId: incomingCall.chatRoomId,
        userId: currentUserId,
        userName: currentUserName,
      });
    } catch (err) {
      console.error("Failed to accept call:", err);
      toast.error("Failed to join the call");
      setIncomingCall(null);
    }
  }, [
    currentUserId,
    currentUserName,
    setLocalStream,
    setCallType,
    setCallChatRoomId,
    setIncomingCall,
    setCallState,
    setActiveChatId,
    addParticipant,
  ]);

  const handleRejectCall = useCallback(() => {
    const { incomingCall } = useCallStore.getState();
    if (!incomingCall || !currentUserId) return;

    const socket = getSocket();
    socket.emit("call-reject", {
      chatRoomId: incomingCall.chatRoomId,
      userId: currentUserId,
      callerId: incomingCall.callerId,
    });
    setIncomingCall(null);
  }, [currentUserId, setIncomingCall]);

  const handleChatCreated = useCallback(
    (chatRoomId: string) => {
      fetchChatRooms().then(() => {
        setActiveChatId(chatRoomId);
        const socket = getSocket();
        socket.emit("join-chat-room", chatRoomId);
      });
    },
    [fetchChatRooms, setActiveChatId]
  );

  const handleLeave = useCallback(async () => {
    if (!activeChatId) return;
    try {
      const response = await chatService.leaveChatRoom(activeChatId);
      if (response.success) {
        setActiveChatId(null);
        fetchChatRooms();
        toast.success("Left the chat");
      }
    } catch {
      toast.error("Failed to leave chat");
    }
  }, [activeChatId, setActiveChatId, fetchChatRooms]);

  const handleRename = useCallback(() => {
    if (!activeChatRoom || activeChatRoom.type !== "GROUP") return;
    setEditingRoom(activeChatRoom);
  }, [activeChatRoom]);

  const handleDeleteClick = useCallback(() => {
    if (!activeChatId) return;
    setDeleteConfirmOpen(true);
  }, [activeChatId]);

  const handleConfirmDelete = useCallback(async () => {
    if (!activeChatId) return;
    try {
      const response = await chatService.deleteChatRoom(activeChatId);
      if (response.success) {
        setActiveChatId(null);
        fetchChatRooms();
        toast.success("Group deleted");
      }
    } catch {
      toast.error("Failed to delete group");
    } finally {
      setDeleteConfirmOpen(false);
    }
  }, [activeChatId, setActiveChatId, fetchChatRooms]);

  return (
    <div className="flex h-full overflow-hidden border bg-background">
      <ChatSidebar onNewChat={() => setNewChatOpen(true)} />
      <ChatArea
        chatRoom={activeChatRoom}
        onAddMembers={() => setAddMembersOpen(true)}
        onLeave={handleLeave}
        onRename={handleRename}
        onDelete={handleDeleteClick}
        onStartCall={handleStartCall}
      />
      <NewChatModal
        isOpen={newChatOpen || !!editingRoom}
        onClose={() => { setNewChatOpen(false); setEditingRoom(null); }}
        onChatCreated={(id) => { handleChatCreated(id); setEditingRoom(null); }}
        editRoom={editingRoom}
      />
      {activeChatRoom && activeChatRoom.type === "GROUP" && (
        <AddMembersModal
          isOpen={addMembersOpen}
          onClose={() => setAddMembersOpen(false)}
          chatRoomId={activeChatRoom.id}
          existingMemberIds={
            activeChatRoom.members?.map((m) => m.userId) || []
          }
          onMembersAdded={() => {
            fetchChatRooms();
            if (activeChatId) fetchMessages(activeChatId);
          }}
        />
      )}
      <ConfirmDeleteDialog
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        itemName={activeChatRoom?.name || "this group"}
        itemType="group"
      />
      <IncomingCallDialog
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    </div>
  );
}

function AddMembersModal({
  isOpen,
  onClose,
  chatRoomId,
  existingMemberIds,
  onMembersAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  chatRoomId: string;
  existingMemberIds: string[];
  onMembersAdded: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setUsers([]);
      setSelectedIds([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { apiService } = await import("@/api/apiService");
        const response = await apiService.get<any>("/users", {
          searchTerm,
          limit: 20,
        });
        if (response.success && response.data) {
          const filtered = (response.data.data || []).filter(
            (u: any) => !existingMemberIds.includes(u.id)
          );
          setUsers(filtered);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, existingMemberIds]);

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    setAdding(true);
    try {
      const response = await chatService.addMembers(chatRoomId, {
        userIds: selectedIds,
      });
      if (response.success) {
        toast.success("Members added");
        onMembersAdded();
        onClose();
      }
    } catch {
      toast.error("Failed to add members");
    } finally {
      setAdding(false);
    }
  };

  return (
    <AddMembersDialogUI
      isOpen={isOpen}
      onClose={onClose}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      users={users}
      selectedIds={selectedIds}
      onToggleUser={(id: string) =>
        setSelectedIds((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
      }
      loading={loading}
      adding={adding}
      onAdd={handleAdd}
    />
  );
}
