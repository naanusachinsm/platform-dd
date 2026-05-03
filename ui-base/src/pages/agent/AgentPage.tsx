import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Send,
  Plus,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Sparkles,
  MessageSquare,
  Wrench,
} from "lucide-react";
import { agentService } from "@/api/agentService";
import type {
  AgentChatResponse,
  ToolExecutionSummary,
  SuggestedAction,
  ConfirmationRequest,
} from "@/api/agentTypes";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolsExecuted?: ToolExecutionSummary[];
  confirmationRequired?: ConfirmationRequest;
  suggestedActions?: SuggestedAction[];
}

const EXAMPLE_PROMPTS = [
  { icon: Sparkles, label: "Show me all overdue CRM deals" },
  { icon: Plus, label: "Create a new project called Phoenix" },
  { icon: MessageSquare, label: "What's the HR attendance summary?" },
  { icon: Wrench, label: "List all unpaid invoices" },
];

export default function AgentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState(crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [toolCount, setToolCount] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    agentService.getAvailableTools().then((res) => {
      if (res.success && res.data) setToolCount(res.data.length);
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const res = await agentService.chat(trimmed, conversationId);
      if (res.success && res.data) {
        const data: AgentChatResponse = res.data;
        if (data.conversationId) setConversationId(data.conversationId);

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          toolsExecuted: data.toolsExecuted,
          confirmationRequired: data.confirmationRequired,
          suggestedActions: data.suggestedActions,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        toast.error(res.message || "Failed to get response");
      }
    } catch {
      toast.error("An error occurred while contacting the agent");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleConfirm = async (confirmed: boolean) => {
    setLoading(true);
    try {
      const res = await agentService.confirmAction(conversationId, confirmed);
      if (res.success && res.data) {
        const data: AgentChatResponse = res.data;
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          toolsExecuted: data.toolsExecuted,
          suggestedActions: data.suggestedActions,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        toast.error(res.message || "Confirmation failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(crypto.randomUUID());
    setInputValue("");
    inputRef.current?.focus();
  };

  const hasConfirmationPending = messages.some(
    (m) => m.confirmationRequired && m === messages[messages.length - 1]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Agent</h1>
            {toolCount > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wrench className="h-3 w-3" />
                {toolCount} tools available
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleNewConversation}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Conversation
        </Button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-6">
          {messages.length === 0 ? (
            <EmptyState onSelect={handleSend} />
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onConfirm={handleConfirm}
                  onSelectAction={handleSend}
                  isLastMessage={msg === messages[messages.length - 1]}
                  loading={loading}
                />
              ))}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Input Area */}
      <div className="mx-auto w-full max-w-4xl px-6 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputValue);
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask the agent anything..."
            disabled={loading || hasConfirmationPending}
            className="h-11 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 shrink-0"
            disabled={loading || !inputValue.trim() || hasConfirmationPending}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mb-2 text-xl font-semibold">How can I help you today?</h2>
      <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
        I can search data, create records, generate reports, and more. Try one of
        the examples below or type your own request.
      </p>
      <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <Card
            key={prompt.label}
            className="cursor-pointer py-0 transition-colors hover:bg-accent"
            onClick={() => onSelect(prompt.label)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <prompt.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">{prompt.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onConfirm,
  onSelectAction,
  isLastMessage,
  loading,
}: {
  message: ChatMessage;
  onConfirm: (confirmed: boolean) => void;
  onSelectAction: (text: string) => void;
  isLastMessage: boolean;
  loading: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Bot className="h-4 w-4" />
      </div>
      <div className="min-w-0 max-w-[85%] space-y-3">
        {/* Tool execution badges */}
        {message.toolsExecuted && message.toolsExecuted.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.toolsExecuted.map((tool, i) => (
              <Badge
                key={`${tool.name}-${i}`}
                variant="outline"
                className={
                  tool.success
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                }
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
        )}

        {/* Message content */}
        <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Confirmation card */}
        {message.confirmationRequired && isLastMessage && (
          <Card className="border-amber-200 bg-amber-50/50 py-0 dark:border-amber-800 dark:bg-amber-950/30">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-sm">
                  <p className="font-medium">Confirmation Required</p>
                  <p className="mt-1 text-muted-foreground">
                    {message.confirmationRequired.description}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onConfirm(true)}
                  disabled={loading}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onConfirm(false)}
                  disabled={loading}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggested actions */}
        {message.suggestedActions &&
          message.suggestedActions.length > 0 &&
          isLastMessage && (
            <div className="flex flex-wrap gap-2">
              {message.suggestedActions.map((action) => (
                <Button
                  key={action.prompt}
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal py-1.5 text-xs"
                  onClick={() => onSelectAction(action.prompt)}
                  disabled={loading}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
