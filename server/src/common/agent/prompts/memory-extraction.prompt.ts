export const MEMORY_EXTRACTION_PROMPT = `You are a memory extraction system. Analyze this conversation and extract facts worth remembering for future conversations with this user.

## Conversation:
{{conversationHistory}}

## Existing User Memories (do NOT duplicate these):
{{existingUserMemories}}

## Existing Organization Memories (do NOT duplicate these):
{{existingOrgMemories}}

Extract memories in these categories:

### User Memories (specific to this user):
- PREFERENCE: How the user likes responses formatted, detail level, language, currency preference
- SHORTCUT: Nicknames, abbreviations, references (e.g., "my project" = Project Phoenix, "the team" = Sarah, Mike, John)
- FACT: Specific facts about the user's work, role, responsibilities, deadlines
- PATTERN: Recurring behaviors, workflows, schedules (e.g., "checks deals every Monday")
- CONTEXT: Important context from this conversation that might be relevant in a future conversation

### Organization Memories (shared across all users):
- TERMINOLOGY: Business-specific terms, abbreviations, naming conventions
- WORKFLOW: Standard processes, approval flows, cadences (e.g., "sprint = 2 weeks, starts Monday")
- BUSINESS_RULE: Policies, defaults, constraints (e.g., "payment terms = Net 30", "fiscal year = April-March")
- KNOWLEDGE: Key business facts (e.g., "largest client = Acme Corp", "3 offices: NYC, London, Mumbai")

Return JSON:
{
  "userMemories": [
    {
      "category": "SHORTCUT",
      "content": "When user says 'my project', they mean Project Phoenix (key: PHNX, ID: abc-123)",
      "importance": "high"
    }
  ],
  "orgMemories": [
    {
      "category": "BUSINESS_RULE",
      "content": "Standard invoice payment terms are Net 30 days",
      "importance": "medium"
    }
  ]
}

Rules:
- Only extract genuinely useful information — not trivial conversation filler
- Do NOT duplicate anything already in existing memories
- If an existing memory needs updating (e.g., deadline changed), include the updated version with a note
- Mark importance: "high" (will definitely be useful), "medium" (likely useful), "low" (might be useful)
- Maximum 5 user memories and 3 org memories per conversation
- Org memories must be objectively true business facts, not one user's opinion
- Include entity IDs when available — they save the agent from having to look things up
- Prefer specific, actionable memories over vague ones
  - Good: "User's project = Phoenix (ID: abc-123, key: PHNX)"
  - Bad: "User works on a project"`;

export function buildMemoryExtractionPrompt(params: {
  conversationHistory: string;
  existingUserMemories: string;
  existingOrgMemories: string;
}): string {
  return MEMORY_EXTRACTION_PROMPT
    .replace('{{conversationHistory}}', params.conversationHistory)
    .replace('{{existingUserMemories}}', params.existingUserMemories || '(none yet)')
    .replace('{{existingOrgMemories}}', params.existingOrgMemories || '(none yet)');
}
