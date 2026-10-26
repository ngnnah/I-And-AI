# Live desk

My Claude Code setup, on trial since 21 Oct 2026. macOS and the VS Code extension.

## What

Claude writes each session's replies to a markdown file in `~/claude-replies`, the session's live desk. A Status block on top says what's now, what's next, what's decided and what's done, and a log of every reply sits below.

I read it in MarkText and answer inline, right next to the point I'm answering. In chat, Claude posts one line with a link to the new log entry.

A sample desk, `~/claude-replies/2026-10-21-dotfiles-reply-file-setup.md`:

```markdown
## Status · updated 10-21 23:57
### Now
Working out how to share this setup with the team.
### Next
- Yours: check that each session's Status stays current.
### Decisions
- Replies live in ~/claude-replies so they survive a reboot; you picked it (§2).
### Done
- Reply file and focus view set up (§1).

## Log
### 2 · 10-21 17:36 · Folder moved
Which one do you want? Answer with a `>>` line under this.
- >> you run open
```

## Why

After ten turns in a session, it's hard to say what's done, what's happening now and what's next. The answers are buried in chat, and the VS Code panel jumps to the bottom on every approval.

The desk keeps all of that in one file that stays where you left it.

## Setup

1. **Save the rules.** Copy [`live-desk.md`](live-desk.md) and save it as `~/.claude/rules/live-desk.md`. Claude Code loads every file in `~/.claude/rules/` in every session. After copying, this does it:

   ```bash
   mkdir -p ~/.claude/rules && pbpaste > ~/.claude/rules/live-desk.md
   ```

2. **MarkText.** Install [MarkText](https://github.com/marktext/marktext/releases), open the `~/claude-replies` folder, and turn on Auto Save in Preferences. Claude reads what's on disk, so an unsaved answer is invisible to it.

3. **Allow rules.** Add these to `permissions.allow` in `~/.claude/settings.json`, so writing the desk, opening it and checking the time never stop for an approval:

   ```json
   "Edit(~/claude-replies/**)",
   "Bash(open -a MarkText ~/claude-replies/*)",
   "Bash(date:*)",
   ```

## Optional extras

**Focus view** hides tool calls, so the panel shows only prompts and replies. Add to your VS Code user settings:

```json
"claudeCode.focusView": true,
"claudeCode.scrollToBottomOnSend": false,
```

**The hook** nudges Claude when Status goes quiet for 10 tool calls, and reminds it to hand off after about 15 turns or 250k tokens. It needs `jq`. Copy [`desk-nudge.sh`](desk-nudge.sh), then:

```bash
mkdir -p ~/.claude/hooks && pbpaste > ~/.claude/hooks/desk-nudge.sh && chmod +x ~/.claude/hooks/desk-nudge.sh
```

Then merge this into the `"hooks"` object in `~/.claude/settings.json`:

```json
"PostToolUse": [
  {"hooks": [{"type": "command", "command": "~/.claude/hooks/desk-nudge.sh", "timeout": 5}]}
],
"UserPromptSubmit": [
  {"hooks": [{"type": "command", "command": "~/.claude/hooks/desk-nudge.sh", "timeout": 5}]}
]
```

## Using it

- Answer with `>>`, on its own line under the question or at the end of the question's line: `- Push it? >> yes`.
- Then send `>>` in chat. It's also how you tell Claude a run or step is done. A single `>` still works in the file.
- Add a todo anytime, in chat or in the file. It goes under Next and stays there until it's done.
- When a session gets long, Claude writes a Handoff entry. It opens with a resume line, `Resume from the live desk ~/claude-replies/<file>, handoff §<n>`, that you paste into a fresh session.

## Codex

Append the same text to `~/.codex/AGENTS.md`. I haven't tested that yet. Focus view and the hook are Claude Code only.

## Limitations

- It's a trial on one person's setup.
- Nothing enforces the rules, and the hook only nudges.
- Tool approvals still pull the VS Code panel to the bottom, and `open -a` is macOS-only.

## The deck

[`director-deck.html`](director-deck.html) is a picture-book deck about the workflow. GitHub shows HTML as source, so open it in a browser from a clone of the repo, since it loads its photos from `faces/`. Or read [`offline/director-storybook.pdf`](offline/director-storybook.pdf) right on GitHub; [`offline/director-storybook.html`](offline/director-storybook.html) is the same pages as one self-contained file.
