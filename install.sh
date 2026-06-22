#!/usr/bin/env bash
# Install j-flow skills for AI coding environments.
# Creates symlinks from this repo's skills/ into the user-level skills folder.
#
# Usage:
#   bash install.sh             # interactive (asks which targets)
#   bash install.sh --copilot   # GitHub Copilot CLI / Cursor / Codex (~/.agents/skills)
#   bash install.sh --claude    # Claude Code (~/.claude/skills)
#   bash install.sh --all       # both targets

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_SRC="$SCRIPT_DIR/skills"

CLAUDE_DST="$HOME/.claude/skills"
AGENTS_DST="$HOME/.agents/skills"

if [[ ! -d "$SKILLS_SRC" ]]; then
  echo "ERROR: skills/ not found at $SKILLS_SRC"
  exit 1
fi

install_to() {
  local dst="$1"
  local count=0

  mkdir -p "$dst"

  for skill_dir in "$SKILLS_SRC"/j-flow-*; do
    name=$(basename "$skill_dir")
    target="$dst/$name"

    if [[ -L "$target" ]]; then
      rm "$target"
    elif [[ -e "$target" ]]; then
      echo "  SKIP $name (exists as real directory — remove manually to replace)"
      continue
    fi

    ln -s "$skill_dir" "$target"
    echo "  → $name"
    ((count++)) || true
  done

  echo "  $count skill(s) linked to $dst"
}

do_copilot=false
do_claude=false

if [[ $# -eq 0 ]]; then
  echo "j-flow skill installer"
  echo ""
  echo "Install target:"
  echo "  1) GitHub Copilot CLI / Cursor / Codex  (~/.agents/skills)"
  echo "  2) Claude Code                           (~/.claude/skills)"
  echo "  3) Both"
  read -rp "Enter choice [1/2/3]: " choice
  case "$choice" in
    1) do_copilot=true ;;
    2) do_claude=true ;;
    3) do_copilot=true; do_claude=true ;;
    *) echo "Invalid choice."; exit 1 ;;
  esac
else
  for arg in "$@"; do
    case "$arg" in
      --copilot) do_copilot=true ;;
      --claude)  do_claude=true ;;
      --all)     do_copilot=true; do_claude=true ;;
      *) echo "Unknown argument: $arg"; exit 1 ;;
    esac
  done
fi

if $do_copilot; then
  echo ""
  echo "Installing to $AGENTS_DST (Copilot CLI / Cursor / Codex):"
  install_to "$AGENTS_DST"
fi

if $do_claude; then
  echo ""
  echo "Installing to $CLAUDE_DST (Claude Code):"
  install_to "$CLAUDE_DST"
fi

echo ""
echo "Done. Skills available in your next session."
echo "To update: git -C \"$SCRIPT_DIR\" pull && bash \"$SCRIPT_DIR/install.sh\""
