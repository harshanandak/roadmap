# AI Model Routing

## Capability Routing

| Capability | Primary | Fallback | Tertiary |
|------------|---------|----------|----------|
| Strategic Reasoning | GLM 4.7 | DeepSeek V3.2 | Gemini 3 Flash |
| Agentic Tool Use | GLM 4.7 | Gemini 3 Flash | MiniMax M2.1 |
| Coding | MiniMax M2.1 | GLM 4.7 | Kimi K2 |
| Visual Reasoning | Gemini 3 Flash | Grok 4 Fast | GPT-4o |
| Large Context | Grok 4.1 Fast | Gemini 3 Flash | Kimi K2 |
| Default Chat | Kimi K2 | GLM 4.7 | MiniMax M2.1 |

**AVOID**: Claude Sonnet models (too costly)

## Multi-Agent Patterns

| Scenario | Pattern |
|----------|---------|
| Multiple specializations needed | **Parallel** - launch together |
| Output feeds next agent | **Sequential** - chain them |
| Critical feature needs QA | **Review Gate** - implement -> audit -> review |
| Uncertain scope | **Exploration** - explore -> plan -> implement |

## Context Management

**When to `/clear`**:
- After 50+ tool calls
- Switching unrelated features
- Before complex multi-file changes

**Sub-Agents** (preserve main context):
- `Explore` - complex search
- `Plan` - architecture design
- `code-reviewer` - quality check
- `debugger` - focused investigation
