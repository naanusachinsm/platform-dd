import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  Plus,
  Check,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { agentService } from "@/api/agentService";
import type {
  AgentMessage,
  SuggestedAction,
  ConfirmationRequest,
  ToolExecutionSummary,
} from "@/api/agentTypes";

const SUGGESTIONS = [
  "Show me all overdue CRM deals",
  "What's the project status?",
  "List unpaid invoices",
  "Who's on leave this week?",
];

function ToolBadges({ tools }: { tools: ToolExecutionSummary[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tools.map((tool, i) => (
        <Badge
          key={i}
          variant={tool.success ? "secondary" : "destructive"}
          className="gap-1 text-xs font-normal"
        >
          {tool.success ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
          {tool.name}
          <span className="opacity-60">{tool.durationMs}ms</span>
        </Badge>
      ))}
    </div>
  );
}

function ConfirmationCard({
  confirmation,
  onRespond,
  disabled,
}: {
  confirmation: ConfirmationRequest;
  onRespond: (confirmed: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Confirmation Required
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {confirmation.description}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Tool: {confirmation.tool}
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="default"
              className="h-7 gap-1 bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => onRespond(true)}
              disabled={disabled}
            >
              <Check className="h-3 w-3" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1"
              onClick={() => onRespond(false)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isLast,
  onConfirm,
  onSuggestedAction,
  confirmLoading,
}: {
  message: AgentMessage;
  isLast: boolean;
  onConfirm: (confirmed: boolean) => void;
  onSuggestedAction: (action: SuggestedAction) => void;
  confirmLoading: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] space-y-1 ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-muted text-foreground"
          }`}
        >
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>

        {message.toolsExecuted && message.toolsExecuted.length > 0 && (
          <ToolBadges tools={message.toolsExecuted} />
        )}

        {message.confirmationRequired && isLast && (
          <ConfirmationCard
            confirmation={message.confirmationRequired}
            onRespond={onConfirm}
            disabled={confirmLoading}
          />
        )}

        {message.suggestedActions &&
          message.suggestedActions.length > 0 &&
          isLast && (
            <div className="flex gap-2 overflow-x-auto py-2 scrollbar-thin">
              {message.suggestedActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestedAction(action)}
                  className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

interface AgentChatPanelProps {
  userName?: string;
}

export default function AgentChatPanel({ userName }: AgentChatPanelProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>(
    crypto.randomUUID()
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(crypto.randomUUID());
    setInput("");
    setLoading(false);
    setConfirmLoading(false);
  }, []);

  const handleSend = useCallback(
    async (text?: string) => {
      const message = (text ?? input).trim();
      if (!message || loading) return;

      const userMessage: AgentMessage = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const response = await agentService.chat(message, conversationId);

        if (response.success && response.data) {
          const { data } = response;
          setConversationId(data.conversationId);

          const agentMsg: AgentMessage = {
            role: "assistant",
            content: data.response,
            timestamp: new Date().toISOString(),
            toolsExecuted: data.toolsExecuted,
            suggestedActions: data.suggestedActions,
            confirmationRequired: data.confirmationRequired,
          };
          setMessages((prev) => [...prev, agentMsg]);
        } else {
          toast.error(response.message || "Failed to get response");
        }
      } catch {
        toast.error("Failed to communicate with agent");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, conversationId]
  );

  const handleConfirm = useCallback(
    async (confirmed: boolean) => {
      if (!conversationId || confirmLoading) return;

      setConfirmLoading(true);
      try {
        const response = await agentService.confirmAction(
          conversationId,
          confirmed
        );

        if (response.success && response.data) {
          const { data } = response;
          const agentMsg: AgentMessage = {
            role: "assistant",
            content: data.response,
            timestamp: new Date().toISOString(),
            toolsExecuted: data.toolsExecuted,
            suggestedActions: data.suggestedActions,
            confirmationRequired: data.confirmationRequired,
          };
          setMessages((prev) => [...prev, agentMsg]);
        } else {
          toast.error(response.message || "Action failed");
        }
      } catch {
        toast.error("Failed to process confirmation");
      } finally {
        setConfirmLoading(false);
      }
    },
    [conversationId, confirmLoading]
  );

  const handleSuggestedAction = useCallback(
    (action: SuggestedAction) => {
      handleSend(action.prompt);
    },
    [handleSend]
  );

  return (
    <SheetContent
      side="right"
      className="flex w-full flex-col gap-0 p-0 sm:max-w-md [&>button:last-child]:hidden"
    >
      <SheetHeader className="shrink-0 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            AI Agent
          </SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={startNewChat}
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>
        <SheetDescription className="sr-only">
          Chat with the AI agent to manage your data
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-4 p-4">
          {messages.length === 0 && !loading && (
            <div className="text-center py-8">
              <Bot className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                {userName
                  ? `Hi ${userName}! How can I help you?`
                  : "How can I help you?"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                I can read and write data across all your modules.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-xs px-3 py-1.5 rounded-full border hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              isLast={i === messages.length - 1}
              onConfirm={handleConfirm}
              onSuggestedAction={handleSuggestedAction}
              confirmLoading={confirmLoading}
            />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything..."
            disabled={loading}
            className="flex-1 h-9 text-sm"
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="shrink-0 size-9"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </SheetContent>
  );
}
