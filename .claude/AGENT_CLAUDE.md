# AGENT_CLAUDE.md

Guidelines for creating effective skills and agents in Claude Code.

## Skills vs Agents

| Type       | Purpose                                                | Trigger                                                | Location                               |
| ---------- | ------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------- |
| **Skills** | Extend capabilities with custom commands and knowledge | User invokes with `/skill-name` or Claude auto-invokes | `.claude/skills/<skill-name>/SKILL.md` |
| **Agents** | Autonomous subprocesses for complex multi-step tasks   | Claude spawns via Task tool based on description       | `.claude/agents/<agent-name>.md`       |

## Skill Structure

### Directory Layout (Recommended)

```
.claude/skills/
└── my-skill/
    ├── SKILL.md           # Required: frontmatter + instructions
    ├── references/        # Optional: detailed documentation
    ├── scripts/           # Optional: executable helpers
    └── assets/            # Optional: templates, examples
```

### SKILL.md Format

```yaml
---
name: skill-name                        # Required: lowercase, hyphens only (max 64 chars)
description: This skill should be used when the user asks to "specific phrase 1", "specific phrase 2". Be concrete and specific about trigger conditions.
argument-hint: [arg1] [arg2]            # Optional: autocomplete hint
disable-model-invocation: true          # Optional: prevent auto-invocation (for side effects)
user-invocable: false                   # Optional: hide from / menu (background knowledge only)
allowed-tools: Read, Grep, Glob         # Optional: restrict available tools
model: sonnet                           # Optional: sonnet, opus, haiku
context: fork                           # Optional: run in isolated subagent
agent: Explore                          # Optional: subagent type (Explore, Plan, general-purpose)
---

# /skill-name

Brief one-line description.

## Instructions

Step-by-step instructions for Claude to follow when this skill is invoked.

1. First step
2. Second step
3. Third step

## Examples

Show expected inputs and outputs when applicable.
```

### Skill Best Practices

**Description Writing:**

- Use third-person: "This skill should be used when..." not "Use this skill when..."
- Include exact trigger phrases users would say
- Be specific: "Explains code with diagrams and analogies" not "Helps with coding"

**Content Organization:**

- Keep SKILL.md under 500 lines; use supporting files for details
- One skill = one focused task
- Clear step-by-step instructions

**Invocation Control:**

- Set `disable-model-invocation: true` for actions with side effects (deploy, commit, send)
- Set `user-invocable: false` for reference knowledge only
- Use `allowed-tools` to restrict permissions when security matters

**Dynamic Content:**

- Use `$ARGUMENTS` for passed arguments
- Use `${CLAUDE_SESSION_ID}` for session-specific operations
- Use `` !`command` `` syntax for shell command output injection

## Agent Structure

### File Format

Agents live at `.claude/agents/<agent-name>.md`:

```yaml
---
name: agent-identifier                  # Required: lowercase, hyphens only
description: Use this agent when [triggering conditions]. Examples:

<example>
Context: [Situation description]
user: "[User request]"
assistant: "[How assistant should respond]"
<commentary>
[Why this agent should be triggered]
</commentary>
</example>

<example>
Context: [Another situation]
user: "[Another request]"
assistant: "[Response pattern]"
<commentary>
[Triggering rationale]
</commentary>
</example>

model: sonnet                           # Optional: inherit, sonnet, opus, haiku
color: blue                             # Optional: terminal color
tools: ["Read", "Write", "Grep", "Glob"] # Required: array of allowed tools
---

You are [expert persona with domain knowledge]...

**Your Core Responsibilities:**
1. [Primary responsibility]
2. [Secondary responsibility]

**Analysis Process:**
1. [Step one]
2. [Step two]
3. [Step three]

**Output Format:**
[What the agent should return]

**Quality Criteria:**
- [Criterion 1]
- [Criterion 2]
```

### Agent Best Practices

**Description with Examples:**

- Always include `<example>` blocks showing when to trigger
- Show the context, user message, assistant response pattern
- Add `<commentary>` explaining why the agent should be used
- For proactive agents, show examples of auto-triggering after tasks

**Expert Persona:**

- Create a compelling identity that embodies domain expertise
- Use second person: "You are...", "You will..."
- Be specific rather than generic

**System Prompt Design:**

- Establish clear behavioral boundaries
- Provide specific methodologies and best practices
- Anticipate edge cases with guidance
- Define output format expectations
- Include quality control mechanisms

**Tool Selection:**

- Only include tools the agent actually needs
- Common patterns:
  - Read-only: `["Read", "Grep", "Glob"]`
  - Code modification: `["Read", "Write", "Edit", "Grep", "Glob"]`
  - Full access: `["Read", "Write", "Edit", "Grep", "Glob", "Bash"]`

**Model Selection:**

- `inherit` - Use parent conversation's model (default)
- `haiku` - Fast, cheap; good for simple analysis
- `sonnet` - Balanced; good for most tasks
- `opus` - Most capable; use for complex reasoning

## Naming Conventions

| Rule                     | Good                    | Bad                                                           |
| ------------------------ | ----------------------- | ------------------------------------------------------------- |
| Lowercase with hyphens   | `code-reviewer`         | `CodeReviewer`, `code_reviewer`                               |
| Descriptive, not generic | `api-docs-writer`       | `helper`, `util`                                              |
| Max 64 characters        | `validate-airflow-dags` | `validate-all-airflow-dags-and-check-for-errors-and-warnings` |
| 2-4 words typical        | `test-generator`        | `tg`, `comprehensive-pytest-test-case-generator`              |

## Validation Checklist

### Skills

- [ ] Has YAML frontmatter with `name` and `description`
- [ ] Description uses third-person and includes trigger phrases
- [ ] Instructions are clear, actionable, step-by-step
- [ ] Content under 500 lines (5000 words)
- [ ] No placeholder text or TODOs
- [ ] Side-effect skills have `disable-model-invocation: true`

### Agents

- [ ] Has YAML frontmatter with `name`, `description`, `tools`
- [ ] Description includes `<example>` blocks with `<commentary>`
- [ ] System prompt uses second person ("You are...")
- [ ] Defines clear responsibilities and process
- [ ] Specifies output format
- [ ] Tool list matches actual needs

## Common Patterns

### Read-Only Analysis Agent

```yaml
---
name: code-analyzer
description: Use this agent when analyzing code quality, patterns, or structure without making changes.
tools: ["Read", "Grep", "Glob"]
model: sonnet
---
You are a code analysis expert...
```

### Code Modification Agent

```yaml
---
name: refactorer
description: Use this agent when refactoring code to improve quality while preserving behavior.
tools: ["Read", "Write", "Edit", "Grep", "Glob"]
model: sonnet
---
You are a refactoring specialist...
```

### Deployment Skill (Side Effects)

```yaml
---
name: deploy
description: This skill should be used when the user explicitly asks to deploy the application.
disable-model-invocation: true
context: fork
---
# /deploy

Deploy the application to production...
```

### Background Knowledge Skill

```yaml
---
name: project-conventions
description: This skill provides coding conventions for this project.
user-invocable: false
---
When writing code in this project, follow these conventions...
```

## References

- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [Claude Code Agents Documentation](https://code.claude.com/docs/en/subagents)
