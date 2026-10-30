# Live desk

My Claude Code setup, on trial since 21 Oct 2026. macOS and the VS Code extension.

## What

Claude writes each session's replies to a markdown file in `~/claude-replies`, the session's live desk, filed in a folder per month. A Status block on top recaps where things stand, then lists what's due now, what comes later, what's decided and what's done, and a log of every reply sits below.

I read it in Obsidian and answer inline, right next to the point I'm answering. In chat, Claude posts one line with a link to the new log entry.

A sample desk, `~/claude-replies/2026-10/21-dotfiles-reply-file-setup.md`:

```markdown
## Status · updated 10-21 23:57
### Now
> [!info] Working
> The reply file and focus view are set up.
> I'm working out how to share the setup with the team.
### Immediate actions
- Mine: draft the setup notes for the team.
### Later
- Yours: check that each session's Status stays current.
### Decisions
- Replies live in ~/claude-replies so they survive a reboot; you picked it (§2).
### Done
- Reply file and focus view set up (§1).

## Log
### @2 · 10-21 17:36 · Folder moved
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

2. **Obsidian.** Install [Obsidian](https://obsidian.md) and open the `~/claude-replies` folder as a vault once ("Open folder as vault"; the same for `~/claude-replies-personal`, if you keep personal desks). From then on, each desk opens in a tab of its own in that vault, never in place of the tab in front: through the desk script below, which can also switch to a desk's tab, or else through the rules' `obsidian://open` link. Obsidian saves as you type, and Claude reads what's on disk, so it sees each answer as soon as you write it. The rules write desks for reading in Obsidian, with callouts, task lists, `==highlights==` and Mermaid flowcharts. Any markdown editor that saves on its own still works, though it shows those as plain markdown; change the rules' open command and the allow rules to match.

3. **Allow rules.** Add these to `permissions.allow` in `~/.claude/settings.json`, so writing the desk, opening it and checking the time never stop for an approval. The last rule is for the desk script, an optional extra below:

   ```json
   "Edit(~/claude-replies/**)",
   "Edit(~/claude-replies-personal/**)",
   "Bash(open 'obsidian://open?*)",
   "Bash(date:*)",
   "Bash(~/.claude/bin/desk:*)",
   ```

## Optional extras

**Focus view** hides tool calls, so the panel shows only prompts and replies. Add to your VS Code user settings:

```json
"claudeCode.focusView": true,
"claudeCode.scrollToBottomOnSend": false,
```

**The hook** nudges Claude when Status goes quiet for 10 tool calls, and after about 15 turns or 400k tokens reminds it to ask you about a fresh session. It also refuses a desk write that looks like a key, token or password, or holds an email address; add your own mail domain to `EMAIL_DOMAINS` at the top of the script. It needs `jq` and `perl`, which macOS ships. Copy [`desk-nudge.sh`](desk-nudge.sh), then:

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
],
"PreToolUse": [
  {"matcher": "Edit|Write|MultiEdit", "hooks": [{"type": "command", "command": "~/.claude/hooks/desk-nudge.sh", "timeout": 5}]}
]
```

**The desk script** does each turn's checks in one allowed call (`desk check`): the time, your open answers (the rules' grep, unchanged), the items you've ticked in Status and where Status's sections are, so Claude doesn't chain `date` and `grep` into a command that stops for an approval. `desk line` finds an entry's line. `desk new` creates a desk in this month's folder, making the folder if it's new, and shows it in Obsidian, and `desk open` shows one a session continues: both switch to the desk's tab if one is open, else open it in a new tab, and never replace the tab in front, which may be another session's desk. Switching tabs needs Obsidian 1.12 or later with its command line interface on (Settings → General → Advanced); without it, a desk already in a tab stays where it is. Writes stay on the Edit tool. It needs `python3`, which the Xcode Command Line Tools install. Copy [`desk`](desk), then:

```bash
mkdir -p ~/.claude/bin && pbpaste > ~/.claude/bin/desk && chmod +x ~/.claude/bin/desk
```

## Using it

- Answer with `>>`, on its own line under the question or at the end of the question's line: `- Push it? >> yes`.
- Then send `>>` in chat. It's also how you tell Claude a run or step is done. Only `>>` counts as an answer: a line that starts with a single `>` is a callout, like the one under Now that says whose move it is.
- What Claude needs from you is a Yours item under Immediate actions, a question or a step; answer it with `>>` like any other line. A bare yes/no item gets a checkbox instead: tick it for yes, and Claude picks the tick up at its next turn, like an answer.
- An answer Claude has handled ends in ` ✓§<n>`, the entry that handled it. An answer without the tag is still open.
- Add a todo anytime, in chat or in the file. It goes under Immediate actions or Later, by when it's due, and stays there until it's done.
- Desks sit in a folder per month, `~/claude-replies/2026-10/29-my-repo-export-retries.md`, and a desk stays in the month it started. Link one desk from another with its month, `[[2026-10/29-my-repo-export-retries]]`, since the day alone repeats each month.
- When a session gets long, Claude asks whether to continue in a fresh one. Say yes, and it writes a Handoff entry that opens with a resume line, `Resume from the live desk ~/claude-replies/<YYYY-MM>/<file>, handoff §<n>`, to paste into the new session.
- Personal work keeps its desks in `~/claude-replies-personal`, so a work sync never sees them.

## Codex

Append the same text to `~/.codex/AGENTS.md`. I haven't tested that yet. Focus view and the hook are Claude Code only.

## Limitations

- It's a trial on one person's setup.
- The hook enforces one rule, keeping keys and email addresses out of a desk, and it can't spot query rows or names. Nothing enforces the rest.
- Tool approvals still pull the VS Code panel to the bottom, and opening a desk in Obsidian (`open`, and the desk script's path to Obsidian's CLI) is macOS-only.

## The deck

[`director-deck.html`](director-deck.html) is a picture-book deck about the workflow, live at [ngnnah.github.io/I-And-AI/projects/live-desk](https://ngnnah.github.io/I-And-AI/projects/live-desk/). Or read [`offline/director-storybook.pdf`](offline/director-storybook.pdf) right on GitHub; [`offline/director-storybook.html`](offline/director-storybook.html) is the same pages as one self-contained file. [`offline/scripts/`](offline/scripts/) has the scripts that rebuild both after a deck page changes.
