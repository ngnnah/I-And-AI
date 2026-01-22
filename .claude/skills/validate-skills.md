---
name: validate-skills
description: Validate all skills and agents have correct format and structure
---

# /validate-skills

Validate that all skills and agents in `.claude/` are properly formatted and functional.

## Instructions

1. **Scan for skill and agent files**:
   - List all `.md` files in `.claude/skills/`
   - List all `.md` files in `.claude/agents/`

2. **Validate each file** has required YAML frontmatter:

   **For Skills** (`.claude/skills/*.md`):

   ```yaml
   ---
   name: skill-name # Required: lowercase, hyphenated
   description: ... # Required: brief description (<100 chars)
   ---
   ```

   **For Agents** (`.claude/agents/*.md`):

   ```yaml
   ---
   name: agent-name # Required: lowercase, hyphenated
   description: ... # Required: brief description (<100 chars)
   tools: Tool1, Tool2 # Required: comma-separated tool list
   model: sonnet # Optional: sonnet, opus, or haiku
   ---
   ```

3. **Check content quality**:
   - Has clear instructions section
   - Instructions are actionable and step-by-step
   - Total content is under 5000 words
   - No placeholder text or TODOs

4. **Report findings**:

   **Valid**:
   - List each valid skill/agent with its name and description

   **Invalid**:
   - List each invalid file with specific issues:
     - Missing frontmatter
     - Missing required fields (name, description, tools for agents)
     - Empty or placeholder content
     - Excessive length

   **Suggestions**:
   - Recommend improvements for borderline cases
   - Flag skills that could benefit from examples
   - Identify potential duplicates or overlapping functionality

5. **Summary**:
   - Total skills: X valid, Y invalid
   - Total agents: X valid, Y invalid
   - Action items if any fixes needed
