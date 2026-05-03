export interface MemoryForPrompt {
  category: string;
  content: string;
}

export function buildMemoryInjectionSection(params: {
  userName: string;
  userMemories: MemoryForPrompt[];
  orgMemories: MemoryForPrompt[];
}): string {
  const sections: string[] = [];

  sections.push('## Your Memory About This User');

  if (params.userMemories.length === 0 && params.orgMemories.length === 0) {
    sections.push(
      `This is your first interaction with ${params.userName}. Pay attention to their preferences and working patterns.`,
    );
    return sections.join('\n');
  }

  if (params.userMemories.length > 0) {
    sections.push(
      `You have the following memories from past conversations with ${params.userName}:`,
    );

    const grouped = groupByCategory(params.userMemories);

    if (grouped.PREFERENCE?.length) {
      sections.push('\n### Preferences');
      grouped.PREFERENCE.forEach((m) => sections.push(`- ${m.content}`));
    }

    if (grouped.SHORTCUT?.length) {
      sections.push('\n### Shortcuts & References');
      grouped.SHORTCUT.forEach((m) => sections.push(`- ${m.content}`));
    }

    if (grouped.FACT?.length) {
      sections.push('\n### Known Facts');
      grouped.FACT.forEach((m) => sections.push(`- ${m.content}`));
    }

    if (grouped.PATTERN?.length) {
      sections.push('\n### Patterns');
      grouped.PATTERN.forEach((m) => sections.push(`- ${m.content}`));
    }

    if (grouped.CONTEXT?.length) {
      sections.push('\n### Recent Context');
      grouped.CONTEXT.forEach((m) => sections.push(`- ${m.content}`));
    }
  }

  if (params.orgMemories.length > 0) {
    sections.push('\n## Organization Knowledge');
    params.orgMemories.forEach((m) =>
      sections.push(`- [${m.category}] ${m.content}`),
    );
  }

  sections.push(`
## How to Use Memories
- If you know an entity ID from memory, use it directly — don't search first
- If you know a user preference, format your response accordingly
- If you know a shortcut (e.g., "my project" = Phoenix), resolve it silently without asking
- If a memory seems outdated based on current conversation, note it but don't rely on it
- When you learn something NEW in this conversation that's worth remembering, the system will extract it automatically — you don't need to do anything special`);

  return sections.join('\n');
}

function groupByCategory(
  memories: MemoryForPrompt[],
): Record<string, MemoryForPrompt[]> {
  return memories.reduce(
    (acc, m) => {
      if (!acc[m.category]) acc[m.category] = [];
      acc[m.category].push(m);
      return acc;
    },
    {} as Record<string, MemoryForPrompt[]>,
  );
}
