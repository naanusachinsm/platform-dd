import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserSummary, ProjectAsset } from "@/api/projectTypes";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  members: UserSummary[];
  assets: ProjectAsset[];
  currentUserId?: string;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

type TriggerType = "@" | "#" | null;

interface MentionEntry {
  displayText: string;
  token: string;
}

const TOKEN_USER_REGEX = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
const TOKEN_ASSET_REGEX = /#\[([^\]]+)\]\(([a-f0-9-]+)\)/g;

function tokenToDisplay(tokenText: string): string {
  return tokenText
    .replace(TOKEN_USER_REGEX, "@$1")
    .replace(TOKEN_ASSET_REGEX, "#$1");
}

function displayToToken(displayText: string, mentions: MentionEntry[]): string {
  let result = displayText;
  const sorted = [...mentions].sort((a, b) => b.displayText.length - a.displayText.length);
  for (const m of sorted) {
    result = result.replaceAll(m.displayText, m.token);
  }
  return result;
}

function extractMentionsFromTokens(tokenText: string): MentionEntry[] {
  const entries: MentionEntry[] = [];
  let match: RegExpExecArray | null;

  const userRegex = new RegExp(TOKEN_USER_REGEX.source, "g");
  while ((match = userRegex.exec(tokenText)) !== null) {
    entries.push({ displayText: `@${match[1]}`, token: match[0] });
  }

  const assetRegex = new RegExp(TOKEN_ASSET_REGEX.source, "g");
  while ((match = assetRegex.exec(tokenText)) !== null) {
    entries.push({ displayText: `#${match[1]}`, token: match[0] });
  }

  return entries;
}

export default function MentionInput({
  value,
  onChange,
  onSubmit,
  members,
  assets,
  currentUserId,
  multiline = false,
  placeholder,
  className,
  autoFocus,
  disabled,
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mentionsRef = useRef<MentionEntry[]>([]);

  const [trigger, setTrigger] = useState<TriggerType>(null);
  const [triggerPos, setTriggerPos] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 4, left: 0 });

  const displayValue = useMemo(() => tokenToDisplay(value), [value]);

  useEffect(() => {
    mentionsRef.current = extractMentionsFromTokens(value);
  }, [value]);

  const filteredMembers = trigger === "@"
    ? members.filter((m) => {
        if (currentUserId && m.id === currentUserId) return false;
        const name = `${m.firstName ?? ""} ${m.lastName ?? ""}`.toLowerCase();
        return name.includes(query.toLowerCase()) || m.email?.toLowerCase().includes(query.toLowerCase());
      })
    : [];

  const filteredAssets = trigger === "#"
    ? assets.filter((a) => a.originalname.toLowerCase().includes(query.toLowerCase()))
    : [];

  const totalItems = trigger === "@" ? filteredMembers.length : filteredAssets.length;

  const updateDropdownPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const paddingLeft = parseInt(getComputedStyle(textarea).paddingLeft) || 12;
    const textBeforeCursor = displayValue.slice(0, textarea.selectionStart);
    const lines = textBeforeCursor.split("\n");
    const rect = textarea.getBoundingClientRect();
    setDropdownPosition({
      top: -4,
      left: paddingLeft + Math.min((lines[lines.length - 1]?.length ?? 0) * 7.5, rect.width - 250),
    });
  }, [displayValue]);

  const emitChange = useCallback(
    (newDisplayText: string) => {
      const tokenized = displayToToken(newDisplayText, mentionsRef.current);
      onChange(tokenized);
    },
    [onChange],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newDisplay = e.target.value;
      const cursorPos = e.target.selectionStart;

      emitChange(newDisplay);

      const charBeforeCursor = newDisplay[cursorPos - 1];
      const charTwoBeforeCursor = newDisplay[cursorPos - 2];

      if (
        (charBeforeCursor === "@" || charBeforeCursor === "#") &&
        (cursorPos === 1 || charTwoBeforeCursor === " " || charTwoBeforeCursor === "\n")
      ) {
        setTrigger(charBeforeCursor as TriggerType);
        setTriggerPos(cursorPos - 1);
        setQuery("");
        setSelectedIndex(0);
        requestAnimationFrame(updateDropdownPosition);
        return;
      }

      if (trigger !== null) {
        const textSinceTrigger = newDisplay.slice(triggerPos + 1, cursorPos);
        if (textSinceTrigger.split(" ").length > 3) {
          setTrigger(null);
          return;
        }
        if (textSinceTrigger.includes("\n") || cursorPos <= triggerPos) {
          setTrigger(null);
          return;
        }
        setQuery(textSinceTrigger);
        setSelectedIndex(0);
      }
    },
    [trigger, triggerPos, emitChange, updateDropdownPosition],
  );

  const selectItem = useCallback(
    (type: "@" | "#", item: UserSummary | ProjectAsset) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      let displayLabel: string;
      let token: string;

      if (type === "@") {
        const user = item as UserSummary;
        const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
        displayLabel = `@${name}`;
        token = `@[${name}](${user.id})`;
      } else {
        const asset = item as ProjectAsset;
        displayLabel = `#${asset.originalname}`;
        token = `#[${asset.originalname}](${asset.id})`;
      }

      mentionsRef.current.push({ displayText: displayLabel, token });

      const before = displayValue.slice(0, triggerPos);
      const after = displayValue.slice(cursorPos);
      const newDisplay = before + displayLabel + " " + after;
      const newCursorPos = before.length + displayLabel.length + 1;

      emitChange(newDisplay);
      setTrigger(null);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [displayValue, triggerPos, emitChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (trigger !== null && totalItems > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalItems);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          if (trigger === "@" && filteredMembers[selectedIndex]) {
            selectItem("@", filteredMembers[selectedIndex]);
          } else if (trigger === "#" && filteredAssets[selectedIndex]) {
            selectItem("#", filteredAssets[selectedIndex]);
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setTrigger(null);
          return;
        }
      }

      if (e.key === "Enter" && !e.shiftKey && !multiline && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
    },
    [trigger, totalItems, selectedIndex, filteredMembers, filteredAssets, selectItem, multiline, onSubmit],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTrigger(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (firstName?: string, lastName?: string) =>
    ((firstName?.charAt(0) ?? "") + (lastName?.charAt(0) ?? "")).toUpperCase() || "?";

  return (
    <div className="relative flex-1">
      <Textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("text-sm resize-none", className)}
        rows={multiline ? 3 : 1}
        autoFocus={autoFocus}
        disabled={disabled}
      />

      {trigger !== null && totalItems > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-64 rounded-md border bg-popover shadow-md"
          style={{ bottom: dropdownPosition.top, left: Math.max(0, dropdownPosition.left) }}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b">
            {trigger === "@" ? "Members" : "Assets"}
          </div>
          <ScrollArea className="max-h-48">
            <div className="p-1">
              {trigger === "@" &&
                filteredMembers.map((member, idx) => (
                  <button
                    key={member.id}
                    type="button"
                    className={cn(
                      "flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-left text-sm cursor-pointer transition-colors",
                      idx === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/50",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectItem("@", member);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <Avatar className="size-5">
                      {member.avatarUrl && <AvatarImage src={member.avatarUrl} />}
                      <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                        {getInitials(member.firstName, member.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <span className="capitalize truncate block text-sm">
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                  </button>
                ))}
              {trigger === "#" &&
                filteredAssets.map((asset, idx) => (
                  <button
                    key={asset.id}
                    type="button"
                    className={cn(
                      "flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-left text-sm cursor-pointer transition-colors",
                      idx === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/50",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectItem("#", asset);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{asset.originalname}</span>
                  </button>
                ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
