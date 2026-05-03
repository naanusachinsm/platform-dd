import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useCallStore } from "@/stores/callStore";

interface IncomingCallDialogProps {
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallDialog({
  onAccept,
  onReject,
}: IncomingCallDialogProps) {
  const incomingCall = useCallStore((s) => s.incomingCall);

  if (!incomingCall) return null;

  const initials = incomingCall.callerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={!!incomingCall} onOpenChange={() => onReject()}>
      <DialogContent className="sm:max-w-[340px] text-center" showCloseButton={false}>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <Avatar className="h-20 w-20 relative">
              <AvatarFallback className="text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div>
            <DialogTitle className="text-lg text-center capitalize">
              {incomingCall.callerName}
            </DialogTitle>
            <DialogDescription className="flex items-center justify-center gap-1.5 mt-1">
              {incomingCall.callType === "video" ? (
                <Video className="h-4 w-4" />
              ) : (
                <Phone className="h-4 w-4" />
              )}
              Incoming {incomingCall.callType} call...
            </DialogDescription>
          </div>

          <div className="flex items-center gap-6 mt-2">
            <Button
              variant="destructive"
              size="icon"
              className="h-14 w-14 rounded-full"
              onClick={onReject}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white"
              onClick={onAccept}
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
