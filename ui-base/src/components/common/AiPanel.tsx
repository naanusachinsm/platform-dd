import { useState, useRef, useEffect, useMemo } from "react";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiPanelProps {
  messages: AiChatMessage[];
  loading: boolean;
  onSend: (message: string) => void;
  onClear: () => void;
  userName?: string;
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted-foreground/10 text-xs">$1</code>');

  const lines = html.split("\n");
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)/);
    if (bulletMatch) {
      if (!inList) { result.push("<ul class='list-disc pl-4 my-1 space-y-0.5'>"); inList = true; }
      result.push(`<li>${bulletMatch[2]}</li>`);
    } else {
      if (inList) { result.push("</ul>"); inList = false; }
      if (line.trim() === "") {
        result.push("<br/>");
      } else {
        result.push(`<p class="my-1">${line}</p>`);
      }
    }
  }
  if (inList) result.push("</ul>");

  return result.join("");
}

const SUGGESTIONS = [
  "What tickets are overdue?",
  "Who has the most work?",
  "Summarize this week's progress",
  "What should we prioritize next?",
];

export function AiPanel({ messages, loading, onSend, onClear, userName }: AiPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
      <SheetHeader className="px-6 pt-6 pb-3 border-b shrink-0">
        <SheetTitle className="flex items-center gap-2">
          <Sparkles className="size-4" /> AI Assistant
        </SheetTitle>
        <SheetDescription>
          Ask anything about your projects, tickets, or team.
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-6 py-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="text-center py-8">
              <Bot className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                {userName ? `Hi ${userName}! How can I help you today?` : 'How can I help?'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSend(s)}
                    className="text-xs px-3 py-1.5 rounded-full border hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                    : "bg-muted [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                }`}
                dangerouslySetInnerHTML={
                  msg.role === "assistant"
                    ? { __html: renderMarkdown(msg.content) }
                    : undefined
                }
              >
                {msg.role === "user" ? msg.content : undefined}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3.5 py-2.5">
                <Loader2 className="size-4 animate-spin" />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t px-4 py-3 flex items-center gap-2">
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="shrink-0 text-xs text-muted-foreground"
          >
            Clear
          </Button>
        )}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Follow up..."
          className="h-9 text-sm"
          disabled={loading}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="shrink-0 size-9"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </SheetContent>
  );
}
