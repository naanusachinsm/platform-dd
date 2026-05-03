import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

interface AddMembersDialogUIProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  users: any[];
  selectedIds: string[];
  onToggleUser: (id: string) => void;
  loading: boolean;
  adding: boolean;
  onAdd: () => void;
}

export default function AddMembersDialogUI({
  isOpen,
  onClose,
  searchTerm,
  onSearchChange,
  users,
  selectedIds,
  onToggleUser,
  loading,
  adding,
  onAdd,
}: AddMembersDialogUIProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
          <DialogDescription>
            Add new members to this group chat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search users..."
              className="pl-8"
            />
          </div>
          <ScrollArea className="h-48">
            {loading && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Searching...
              </p>
            )}
            {!loading && searchTerm && users.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users found
              </p>
            )}
            {users.map((u) => {
              const selected = selectedIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => onToggleUser(u.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                    selected
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {u.firstName?.[0]}
                      {u.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                </button>
              );
            })}
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={onAdd}
              disabled={selectedIds.length === 0 || adding}
            >
              {adding
                ? "Adding..."
                : `Add${selectedIds.length ? ` (${selectedIds.length})` : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
