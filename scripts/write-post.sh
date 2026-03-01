#!/bin/bash
# Gitblog Auto-Post Script
# Generates weekly blog posts based on recent memory and project status
# Usage: ./scripts/write-post.sh

set -e

BLOGBASE_DIR="$HOME/code/gitblog"
MEMORY_DIR="$HOME/.openclaw/workspace/memory"
WORKSPACE_DIR="$HOME/.openclaw/workspace"

# Generate a unique filename for this run
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TEMP_DIR="/tmp/gitblog-post-$TIMESTAMP"
mkdir -p "$TEMP_DIR"

# Read recent memory files for context
echo "Gathering context from memory..."

# Build context string
CONTEXT="Recent Context:\n"

# Get dates of most recent memory files
for file in $(ls -t "$MEMORY_DIR"/*.md 2>/dev/null | head -10); do
  if [ -f "$file" ]; then
    basename=$(basename "$file")
    CONTEXT="${CONTEXT}\n--- $basename ---\n"
    # Get a summary of the content
    CONTEXT="${CONTEXT}$(head -50 "$file" 2>/dev/null)\n"
  fi
done

# Add project status
CONTEXT="${CONTEXT}\n\nPROJECT STATUS:\n"
CONTEXT="${CONTEXT}- KVEC: Healthcare AI venture, node.digital partnership active\n"
CONTEXT="${CONTEXT}- Manifest: iOS app, waiting on TestFlight due to PostHog TS error\n"
CONTEXT="${CONTEXT}- Spicy Regs: Mozilla grant due March 16, content creation ongoing\n"
CONTEXT="${CONTEXT}- PayWell: Digital well-being app built but not actively deployed\n"
CONTEXT="${CONTEXT}- Monty: Children's book content on Instagram\n"

# Create the prompt for content generation
PROMPT_FILE="$TEMP_DIR/prompt.txt"
cat > "$PROMPT_FILE" << 'PROMPT_HEADER'
You are writing a personal blog post for Eugene Kim, a software engineer building multiple ventures toward financial independence.

INSTRUCTIONS:
1. Write a personal blog post (500-1000 words) that reflects on his current journey
2. The post should feel honest, reflective, and practical - written in Eugene's voice
3. Include concrete details and specific examples from his projects (KVEC, Manifest, Spicy Regs, PayWell, Monty book)
4. Write in first person (as if Eugene wrote it)
5. The tone should be conversational but thoughtful, not too polished
6. Avoid generic startup advice - focus on specific experiences and messy realities
7. Topics can include: what he's learning, what's frustrating, small wins, tools he's building, the nature of working alone

OUTPUT FORMAT:
Return ONLY a JSON object like this (no markdown code blocks, just raw JSON):
{
  "title": "Short engaging title (5-8 words max)",
  "content": "The full blog post content as a single string with actual newlines. Use markdown formatting like ## headings and - lists."
}

Context:
PROMPT_HEADER

# Append the context
echo -e "$CONTEXT" >> "$PROMPT_FILE"

# Generate the post using Gemini
echo "Generating blog post content..."

cd "$WORKSPACE_DIR"
POST_RAW=$(cat "$PROMPT_FILE" | openclaw agent run \
  --model gemini-2.5-flash:cloud \
  --thinking off 2>/dev/null || echo "")

# Try to extract title and content
echo "$POST_RAW" > "$TEMP_DIR/raw_output.txt"

TITLE=$(echo "$POST_RAW" | grep -o '"title" *: *"[^"]*"' | head -1 | sed 's/.*"title" *: *"\([^"]*\)".*/\1/')
CONTENT=$(echo "$POST_RAW" | sed -n '/"content" *: *"/,/^.*"[^\\]"$/p' | sed '1s/.*"content" *: *"//' | sed '$s/"$//')

# Fallback if JSON parsing failed
if [ -z "$TITLE" ]; then
  # Try to extract title from beginning
  TITLE=$(echo "$POST_RAW" | grep -m1 "^Title:" | sed 's/Title: *//' || echo "")
fi

if [ -z "$TITLE" ] || [ "$TITLE" = "null" ]; then
  # Default title with date
  DATE_STR=$(date "+%B %d, %Y")
  TITLE="Weekly Notes: $DATE_STR"
fi

if [ -z "$CONTENT" ] || [ ${#CONTENT} -lt 100 ]; then
  # Fallback content if generation failed
  WEEKDAY=$(date "+%A")
  DATE_STR=$(date "+%B %d, %Y")
  
  CONTENT="## $WEEKDAY, $DATE_STR

Another week of building things. I find myself oscillating between excitement about what's possible and the weight of everything that needs doing.

**What's Working**
- The infrastructure is holding up. Crons are running, data is flowing to Notion
- Small wins compound - I can see progress even when it doesn't feel like much

**What's Hard**
- Context switching between projects. It takes so long to get back into a codebase
- The lonely parts of solo building - no one to bounce ideas off in real-time

**What I'm Learning**
Done is better than perfect, but done with intention is better than rushed.

Onward."
fi

echo "Generated title: $TITLE"
echo "Content length: ${#CONTENT} characters"

# Create the git commit
cd "$BLOGBASE_DIR"

# Ensure we're on main branch
git checkout main --quiet 2>/dev/null || true

# Pull any remote changes first
git pull origin main --quiet || true

echo "Creating blog commit..."

# Write content to temp file for proper formatting
BODY_FILE="$TEMP_DIR/body.txt"
echo -e "$CONTENT" > "$BODY_FILE"

# Create the commit using git commit --allow-empty
git commit --allow-empty -m "blog: $TITLE" -m "$(cat "$BODY_FILE")"

# Push to origin silently
echo "Pushing to origin..."
git push origin main --quiet

echo "Blog post published: $TITLE"

# Cleanup
rm -rf "$TEMP_DIR"

exit 0