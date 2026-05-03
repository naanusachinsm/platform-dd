import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X } from "lucide-react";
import { apiService } from "@/api/apiService";
import { chatService } from "@/api/chatService";
import { ChatRoomType } from "@/api/chatTypes";
import type { ChatRoom } from "@/api/chatTypes";
import { toast } from "sonner";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatRoomId: string) => void;
  editRoom?: ChatRoom | null;
}

export default function NewChatModal({
  isOpen,
  onClose,
  onChatCreated,
  editRoom,
}: NewChatModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const isEditing = !!editRoom;
  const isGroup = selectedUsers.length > 1;

  const fetchUsers = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 50 };
      if (term.trim()) params.searchTerm = term;
      const response = await apiService.get<any>("/users", params);
      if (response.success && response.data) {
        setUsers(response.data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => fetchUsers(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchUsers, isOpen]);

  useEffect(() => {
    if (isOpen) fetchUsers("");
  }, [isOpen, fetchUsers]);

  useEffect(() => {
    if (isOpen && editRoom) {
      setGroupName(editRoom.name || "");
      const members: User[] = (editRoom.members || [])
        .filter((m) => m.user)
        .map((m) => ({
          id: m.userId,
          firstName: m.user!.firstName,
          lastName: m.user!.lastName,
          email: m.user!.email || "",
          avatarUrl: m.user!.avatarUrl,
        }));
      setSelectedUsers(members);
    }
  }, [isOpen, editRoom]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setUsers([]);
      setSelectedUsers([]);
      setGroupName("");
    }
  }, [isOpen]);

  const toggleUser = (user: User) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) return prev.filter((u) => u.id !== user.id);
      return [...prev, user];
    });
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) return;

    setCreating(true);
    try {
      if (isEditing && editRoom) {
        const response = await chatService.updateChatRoom(editRoom.id, {
          name: groupName.trim() || undefined,
        });
        if (response.success) {
          onChatCreated(editRoom.id);
          onClose();
          toast.success("Group updated");
        } else {
          toast.error(response.message || "Failed to update group");
        }
      } else {
        const response = await chatService.createChatRoom({
          type: isGroup ? ChatRoomType.GROUP : ChatRoomType.DIRECT,
          memberIds: selectedUsers.map((u) => u.id),
          name: isGroup ? groupName || undefined : undefined,
        });
        if (response.success && response.data) {
          onChatCreated((response.data as any).id);
          onClose();
        } else {
          toast.error(response.message || "Failed to create chat");
        }
      }
    } catch {
      toast.error(isEditing ? "Failed to update group" : "Failed to create chat");
    } finally {
      setCreating(false);
    }
  };

  const selectedIds = new Set(selectedUsers.map((u) => u.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md flex flex-col p-0 gap-0 max-h-[80vh]">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>{isEditing ? "Edit Group" : "New Chat"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update group name and members."
              : "Select one person for a direct chat, or multiple for a group."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-1 space-y-3">
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedUsers.map((user) => (
                <Badge key={user.id} variant="secondary" className="gap-1 pr-1 capitalize">
                  {user.firstName} {user.lastName}
                  <button
                    onClick={() => toggleUser(user)}
                    className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {(isGroup || isEditing) && (
            <div>
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="mt-1"
              />
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-48">
            {loading && (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            )}
            {!loading && users.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchTerm ? "No users found" : "No users available"}
              </p>
            )}
            <div className="space-y-0.5">
              {users.map((user) => {
                const isSelected = selectedIds.has(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <div className="shrink-0 border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={
              selectedUsers.length === 0 ||
              creating ||
              ((isGroup || isEditing) && !groupName.trim())
            }
          >
            {creating ? "Saving..." : isEditing ? "Save Changes" : "Start Chat"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
