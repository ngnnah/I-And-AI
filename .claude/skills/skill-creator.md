# /skill-creator

Create effective skills that extend Claude's capabilities.

## Instructions

Skills are modular packages that transform Claude from general-purpose to specialized agent by bundling procedural knowledge, domain expertise, and reusable resources.

### Skill Structure

Each skill requires:
- **SKILL.md** (mandatory) - YAML frontmatter with name/description, plus markdown instructions
- **Bundled Resources** (optional):
  - `scripts/` - Executable code for deterministic tasks
  - `references/` - Documentation loaded as-needed
  - `assets/` - Templates, icons, fonts for output

### Creation Process

1. **Gather examples**: Identify concrete usage scenarios through user feedback
2. **Analyze patterns**: Identify reusable scripts, references, and assets needed
3. **Initialize structure**: Create skill directory with required files
4. **Write instructions**: Use imperative form in SKILL.md; populate resources
5. **Package and validate**: Ensure skill is properly structured for distribution
6. **Iterate**: Refine based on real-world usage

### Writing Effective Skills

- Keep metadata concise (~100 words)
- SKILL.md body should be <5k words
- Use progressive disclosure: load resources only when needed
- Instructions should be clear, actionable, and step-by-step
- Include examples of expected inputs and outputs
- Define success criteria when applicable

### Skill File Format

```markdown
# /skill-name

Brief one-line description.

## Instructions

Step-by-step instructions for Claude to follow when this skill is invoked.
```
