import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
} from "lucide-react";
import { useCallStore } from "@/stores/callStore";
import { webrtcService } from "@/services/webrtcService";
import { getSocket } from "@/services/socket";

interface CallScreenProps {
  currentUserId: string;
}

function VideoTile({
  stream,
  userName,
  isMuted,
  isVideoOff,
  isSelf,
}: {
  stream: MediaStream | null;
  userName: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSelf?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const showVideo =
    stream && stream.getVideoTracks().length > 0 && !isVideoOff;

  return (
    <div className="relative bg-muted rounded-xl overflow-hidden flex items-center justify-center aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf}
        className={`absolute inset-0 w-full h-full object-cover ${isSelf ? "scale-x-[-1]" : ""} ${showVideo ? "visible" : "invisible"}`}
      />

      {!showVideo && (
        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-2xl font-semibold bg-primary/20">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-md px-2 py-1">
        <span className="text-xs text-white font-medium truncate max-w-[120px]">
          {isSelf ? "You" : userName}
        </span>
        {isMuted && <MicOff className="h-3 w-3 text-red-400" />}
      </div>
    </div>
  );
}

function CallTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <span className="text-sm text-muted-foreground font-mono">
      {hours > 0 ? `${pad(hours)}:` : ""}
      {pad(minutes)}:{pad(seconds)}
    </span>
  );
}

export default function CallScreen({ currentUserId }: CallScreenProps) {
  const {
    callType,
    callChatRoomId,
    participants,
    localStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    callStartedAt,
    setIsMuted,
    setIsVideoOff,
    setIsScreenSharing,
    setScreenStream,
    setCallState,
    setLocalStream,
    reset,
  } = useCallStore();

  const handleToggleMute = useCallback(() => {
    const newMuted = !isMuted;
    webrtcService.toggleAudio(!newMuted);
    setIsMuted(newMuted);

    const socket = getSocket();
    socket.emit("call-toggle-media", {
      chatRoomId: callChatRoomId,
      userId: currentUserId,
      kind: "audio",
      enabled: !newMuted,
    });
  }, [isMuted, callChatRoomId, currentUserId, setIsMuted]);

  const handleToggleVideo = useCallback(() => {
    const newOff = !isVideoOff;
    webrtcService.toggleVideo(!newOff);
    setIsVideoOff(newOff);

    const socket = getSocket();
    socket.emit("call-toggle-media", {
      chatRoomId: callChatRoomId,
      userId: currentUserId,
      kind: "video",
      enabled: !newOff,
    });
  }, [isVideoOff, callChatRoomId, currentUserId, setIsVideoOff]);

  const handleToggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      webrtcService.stopScreenStream();
      setIsScreenSharing(false);
      setScreenStream(null);

      const videoTrack = localStream?.getVideoTracks()[0];
      if (videoTrack) {
        await webrtcService.replaceVideoTrack(videoTrack);
      }
    } else {
      try {
        const screenStream = await webrtcService.getScreenStream();
        setScreenStream(screenStream);
        setIsScreenSharing(true);

        const screenTrack = screenStream.getVideoTracks()[0];
        await webrtcService.replaceVideoTrack(screenTrack);

        screenTrack.onended = () => {
          handleToggleScreenShare();
        };
      } catch {
        // User cancelled the screen share picker
      }
    }
  }, [isScreenSharing, localStream, setIsScreenSharing, setScreenStream]);

  const handleEndCall = useCallback(() => {
    const socket = getSocket();
    socket.emit("call-leave", {
      chatRoomId: callChatRoomId,
      userId: currentUserId,
    });
    webrtcService.cleanup();
    setLocalStream(null);
    setCallState("idle");
    reset();
  }, [callChatRoomId, currentUserId, setLocalStream, setCallState, reset]);

  const totalParticipants = participants.length + 1;
  const gridCols =
    totalParticipants <= 1
      ? "grid-cols-1"
      : totalParticipants <= 4
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <div className="absolute inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">
            {callType === "video" ? "Video" : "Audio"} Call
          </span>
          <span className="text-xs text-muted-foreground">
            {totalParticipants} participant{totalParticipants !== 1 ? "s" : ""}
          </span>
        </div>
        {callStartedAt && <CallTimer startedAt={callStartedAt} />}
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className={`grid ${gridCols} gap-3 h-full auto-rows-fr`}>
          <VideoTile
            stream={localStream}
            userName="You"
            isMuted={isMuted}
            isVideoOff={isVideoOff || callType === "audio"}
            isSelf
          />
          {participants.map((p) => (
            <VideoTile
              key={p.userId}
              stream={p.stream}
              userName={p.userName}
              isMuted={p.isMuted}
              isVideoOff={p.isVideoOff}
            />
          ))}
        </div>
      </div>

      <div className="border-t py-4 flex-shrink-0">
        <div className="flex items-center justify-center gap-3">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isMuted ? "destructive" : "secondary"}
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={handleToggleMute}
                >
                  {isMuted ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
            </Tooltip>

            {callType === "video" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isVideoOff ? "destructive" : "secondary"}
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={handleToggleVideo}
                  >
                    {isVideoOff ? (
                      <VideoOff className="h-5 w-5" />
                    ) : (
                      <Video className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isVideoOff ? "Turn on camera" : "Turn off camera"}
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isScreenSharing ? "default" : "secondary"}
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={handleToggleScreenShare}
                >
                  <MonitorUp className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isScreenSharing ? "Stop sharing" : "Share screen"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>End call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
