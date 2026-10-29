#!/usr/bin/env bash
# Live desk hook, one script for three hook events: a guard on desk writes and
# two nudges. A desk is a .md file directly in ~/claude-replies, by that path
# or the folder it links to.
#
# PreToolUse (Edit, Write, MultiEdit): refuses a desk write whose new text
# looks like a key, token, password, private key or credentialed URL, or holds
# an email address outside EMAIL_DOMAINS. It exits 2 with the kind on stderr,
# which Claude Code hands back to Claude, and never echoes the match. It checks
# every write, subagents included, and fails open: unreadable input or a
# missing jq or perl lets the write through.
#
# The two nudges stay silent until the session first writes its desk, so
# sessions without a desk are never nudged, and both skip subagents (agent_id
# set), since subagents don't write the desk.
#
# PostToolUse (every tool): after LIMIT main-session tool calls without an
# Edit/Write to the desk, it puts a reminder to update Status into Claude's
# context.
#
# UserPromptSubmit: counts the session's prompts and reads the context size
# from the transcript's last assistant usage. Once turns reach HANDOFF_TURNS or
# context reaches HANDOFF_TOKENS, it tells Claude to ask the user at the next
# natural break whether to continue in a fresh session, and to write the
# Handoff entry only after they agree, and shows the user a systemMessage. It
# fires at the first crossing, then again after REFIRE_TURNS more turns or
# REFIRE_TOKENS more tokens. A missing or unreadable transcript keeps it silent.
LIMIT="${DESK_NUDGE_LIMIT:-10}"
HANDOFF_TURNS="${DESK_HANDOFF_TURNS:-15}"
HANDOFF_TOKENS="${DESK_HANDOFF_TOKENS:-400000}"
REFIRE_TURNS=5
REFIRE_TOKENS=100000
STATE_DIR="${TMPDIR:-/tmp}/claude-desk-nudge"
# Email domains the guard lets through (git remotes, commit trailers); add your
# own mail domain here.
EMAIL_DOMAINS="${DESK_GUARD_EMAIL_DOMAINS:-github.com users.noreply.github.com anthropic.com example.com}"

input="$(cat)"
IFS=$'\x1f' read -r session agent tool path event transcript < <(
  jq -r '[.session_id, .agent_id, .tool_name, .tool_input.file_path, .hook_event_name, .transcript_path] | map(. // "") | join("\u001f")' <<<"$input" 2>/dev/null
)

is_desk() { # path
  case "$1" in *.md) ;; *) return 1 ;; esac
  local dir="${1%/*}" real root="$HOME/claude-replies"
  [ "$dir" = "$root" ] && return 0
  real=$(CDPATH= cd -P -- "$dir" 2>/dev/null && pwd -P)
  [ -n "$real" ] && [ "$real" = "$(CDPATH= cd -P -- "$root" 2>/dev/null && pwd -P)" ] && return 0
  return 1
}

if [ "$event" = PreToolUse ]; then
  case "$tool" in Edit | Write | MultiEdit) ;; *) exit 0 ;; esac
  is_desk "$path" || exit 0
  # NOTE: macOS grep has no -P, so the patterns run in perl, which macOS ships.
  # Only the new text is scanned: Edit's new_string, Write's content,
  # MultiEdit's edits[].new_string.
  kinds=$(jq -r '[.tool_input.new_string, .tool_input.content, (.tool_input.edits // [] | .[]? | .new_string)]
    | map(select(type == "string")) | join("\n")' <<<"$input" 2>/dev/null |
    DOMAINS="$EMAIL_DOMAINS" perl -0777 -ne '
      # WHY: perl reads bytes; decoded, lengths count characters, so an ellipsis
      # is one character, not three. Invalid UTF-8 stays as bytes.
      utf8::decode($_);
      my @k;
      push @k, "an AWS access key id" if /\b(?:AKIA|ASIA)[0-9A-Z]{16}/;
      push @k, "a GitHub token" if /\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{20,}/;
      push @k, "a Slack token" if /\bxox[abprs]-[A-Za-z0-9-]{10,}/;
      push @k, "an Anthropic or OpenAI API key" if /\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}/;
      push @k, "a private key block" if /-----BEGIN [A-Z ]*PRIVATE KEY-----/;
      push @k, "credentials in a URL" if m{[a-z][a-z0-9+.-]*://[^/\s:@]+:[^/\s@]+@};
      # NOTE: a value made only of quotes, dots, ellipses, backticks, * or x is a
      # placeholder (password="…", token: ******), not a secret.
      push @k, "a password, secret or token assignment"
        if /(?:password|passwd|secret|api[_-]?key|token)["\x27]?\s*[:=]\s*
            (?![\x22\x27\x60.*x\x{2026}\x{2018}\x{2019}\x{201C}\x{201D}]*(?:\s|\z))\S{6,}/ix;
      my %ok = map { lc($_) => 1 } split " ", $ENV{DOMAINS};
      while (/[A-Za-z0-9._%+-]+@((?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,})/g) {
        next if $ok{lc $1};
        push @k, "an email address";
        last;
      }
      print @k > 1 ? join(", ", @k[0 .. $#k - 1]) . " and $k[-1]" : @k;
    ' 2>/dev/null)
  [ -n "$kinds" ] || exit 0
  echo "Live desk guard: this desk write looks like it contains $kinds. Desks hold working notes only; leave it out or describe it (counts, table names, where it lives)." >&2
  exit 2
fi

[ -n "$session" ] && [ -z "$agent" ] || exit 0

mkdir -p "$STATE_DIR"
state="$STATE_DIR/$session"

if [ "$event" = UserPromptSubmit ]; then
  [ -f "$state" ] || exit 0
  IFS=$'\t' read -r _ desk <"$state"
  turn_state="$state.turns"
  # WHY: the rules have the desk written on the session's first turn, and this
  # branch only runs once it exists, so the first prompt counted here is turn 2.
  turns=1 fired_turns=0 fired_tokens=0
  [ -f "$turn_state" ] && IFS=$'\t' read -r turns fired_turns fired_tokens <"$turn_state"
  turns=$((turns + 1))
  printf '%s\t%s\t%s\n' "$turns" "$fired_turns" "$fired_tokens" >"$turn_state"

  [ -r "$transcript" ] || exit 0
  # NOTE: transcripts pass 10 MB, and the last assistant line sits within a few
  # KB of the end, so only the tail is read. Synthetic (all-zero) and sidechain
  # usage lines are skipped.
  tokens=$(tail -c 2000000 "$transcript" 2>/dev/null | grep '"type":"assistant"' | jq -nR '
    [inputs | fromjson? | select(.type == "assistant" and .isSidechain != true)
     | .message.usage // empty
     | (.input_tokens // 0) + (.cache_read_input_tokens // 0) + (.cache_creation_input_tokens // 0)
     | select(. > 0)] | last // 0' 2>/dev/null)
  case "$tokens" in '' | *[!0-9]*) exit 0 ;; esac

  [ "$turns" -ge "$HANDOFF_TURNS" ] || [ "$tokens" -ge "$HANDOFF_TOKENS" ] || exit 0
  if [ "$fired_turns" -gt 0 ] &&
    [ $((turns - fired_turns)) -lt "$REFIRE_TURNS" ] &&
    [ $((tokens - fired_tokens)) -lt "$REFIRE_TOKENS" ]; then
    exit 0
  fi
  printf '%s\t%s\t%s\n' "$turns" "$turns" "$tokens" >"$turn_state"
  jq -n --arg n "$turns" --arg k "$(((tokens + 500) / 1000))" --arg f "$desk" '{
    systemMessage: "Live desk: \($n) turns, ~\($k)k tokens. Time for a fresh session soon.",
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: "Live desk: this session has run \($n) turns and about \($k)k tokens of context. Per the live desk rules, at the next natural break (work pushed, no agent running, nothing half-done), ask the user whether to continue in a fresh session. Only after they agree, write the Handoff entry in \($f) with the resume line in Status → Now."
    }
  }'
  exit 0
fi

# A desk write arms the counter (first time) and resets it.
case "$tool:$path" in
  Edit:"$HOME"/claude-replies/*.md | Write:"$HOME"/claude-replies/*.md)
    printf '0\t%s\n' "$path" >"$state"
    exit 0
    ;;
esac

[ -f "$state" ] || exit 0
IFS=$'\t' read -r count desk <"$state"
count=$((count + 1))
if [ "$count" -lt "$LIMIT" ]; then
  printf '%s\t%s\n' "$count" "$desk" >"$state"
  exit 0
fi

printf '0\t%s\n' "$desk" >"$state"
jq -n --arg n "$count" --arg f "$desk" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: "Live desk: \($n) tool calls since your last edit to \($f). Update its Status now (Now, plus anything finished, decided or newly open) before you go on."
  }
}'
