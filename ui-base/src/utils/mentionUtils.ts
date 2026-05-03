export type MentionSegment =
  | { type: "text"; content: string }
  | { type: "user"; name: string; id: string }
  | { type: "asset"; name: string; id: string }
  | { type: "link"; url: string };

const USER_MENTION_REGEX = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
const ASSET_MENTION_REGEX = /#\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
const COMBINED_REGEX = /(@\[[^\]]+\]\([a-f0-9-]+\)|#\[[^\]]+\]\([a-f0-9-]+\))/g;
const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

function splitTextWithLinks(text: string): MentionSegment[] {
  const parts: MentionSegment[] = [];
  let lastIndex = 0;
  const regex = new RegExp(URL_REGEX.source, "g");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "link", url: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts;
}

export function parseMentions(content: string): MentionSegment[] {
  if (!content) return [];

  const segments: MentionSegment[] = [];
  let lastIndex = 0;

  const combined = new RegExp(COMBINED_REGEX.source, "g");
  let match: RegExpExecArray | null;

  while ((match = combined.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push(...splitTextWithLinks(content.slice(lastIndex, match.index)));
    }

    const token = match[0];
    if (token.startsWith("@")) {
      const inner = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/.exec(token);
      if (inner) segments.push({ type: "user", name: inner[1], id: inner[2] });
    } else {
      const inner = /#\[([^\]]+)\]\(([a-f0-9-]+)\)/.exec(token);
      if (inner) segments.push({ type: "asset", name: inner[1], id: inner[2] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push(...splitTextWithLinks(content.slice(lastIndex)));
  }

  return segments;
}

export function extractMentionedUserIds(content: string): string[] {
  const ids = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(USER_MENTION_REGEX.source, "g");
  while ((match = regex.exec(content)) !== null) {
    ids.add(match[2]);
  }
  return Array.from(ids);
}

export function insertMention(
  text: string,
  cursorPos: number,
  triggerStartPos: number,
  mentionToken: string,
): { newText: string; newCursorPos: number } {
  const before = text.slice(0, triggerStartPos);
  const after = text.slice(cursorPos);
  const newText = before + mentionToken + " " + after;
  const newCursorPos = before.length + mentionToken.length + 1;
  return { newText, newCursorPos };
}

export function buildUserMentionToken(name: string, id: string): string {
  return `@[${name}](${id})`;
}

export function buildAssetMentionToken(filename: string, id: string): string {
  return `#[${filename}](${id})`;
}
