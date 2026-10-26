#!/usr/bin/env bash
# Live desk nudges, one script for two hook events. Both stay silent until the
# session first writes its desk (~/claude-replies/*.md), so sessions without a
# desk are never nudged, and both skip subagents (agent_id set), since
# subagents don't write the desk.
#
# PostToolUse (every tool): after LIMIT main-session tool calls without an
# Edit/Write to the desk, it puts a reminder to update Status into Claude's
# context.
#
# UserPromptSubmit: counts the session's prompts and reads the context size
# from the transcript's last assistant usage. Once turns reach HANDOFF_TURNS or
# context reaches HANDOFF_TOKENS, it tells Claude to suggest a fresh session and
# write the Handoff entry at the next natural break, and shows the user a
# systemMessage. It fires at the first crossing, then again after REFIRE_TURNS
# more turns or REFIRE_TOKENS more tokens. A missing or unreadable transcript
# keeps it silent.
LIMIT="${DESK_NUDGE_LIMIT:-10}"
HANDOFF_TURNS="${DESK_HANDOFF_TURNS:-15}"
HANDOFF_TOKENS="${DESK_HANDOFF_TOKENS:-250000}"
REFIRE_TURNS=5
REFIRE_TOKENS=100000
STATE_DIR="${TMPDIR:-/tmp}/claude-desk-nudge"

input="$(cat)"
IFS=$'\x1f' read -r session agent tool path event transcript < <(
  jq -r '[.session_id, .agent_id, .tool_name, .tool_input.file_path, .hook_event_name, .transcript_path] | map(. // "") | join("\u001f")' <<<"$input"
)
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
      additionalContext: "Live desk: this session has run \($n) turns and about \($k)k tokens of context. Per the live desk rules, at the next natural break (work pushed, no agent running, nothing half-done), suggest continuing in a fresh session, and first write the Handoff entry in \($f) with the resume line in Status → Now."
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
