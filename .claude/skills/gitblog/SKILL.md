---
name: gitblog
description: Use when writing blog posts, publishing content to the blog, or generating blog entries autonomously. Triggers on "write a blog post", "publish to blog", "blog about X", "/gitblog", or when generating content for gitblog.
---

# Gitblog Publisher

## Overview

Publish blog posts to gitblog — a git-powered blog where commits ARE the content. No files to create, no CMS. Just craft content and commit it.

This skill lives in the gitblog repo at `.claude/skills/gitblog/SKILL.md` and assumes the working directory is the repo root.

## Quick Reference

| Type | Commit format | Use case |
|------|--------------|----------|
| Blog | `blog: Title` | Regular markdown posts |
| Embed | `embed: Title` | Posts with YouTube/Vimeo/Twitter URLs |
| Page | `page: Title` | Standalone pages (about, etc.) |
| Meta  | `meta: anything` | Site config in body as `key: value` lines |

## Branch model

- **`main`** — engine code (build.js, templates, themes, workflow). No content commits.
- **`ekim1394`** — content branch. Engine + content commits. Only this branch deploys via [.github/workflows/deploy.yml](../../../.github/workflows/deploy.yml).
- New posts always go on `ekim1394`, even if the current session started on a feature/dev branch. Engine fixes go on `main` and are merged into `ekim1394`.

Always confirm you are on `ekim1394` before committing content, and switch if not:
```bash
git branch --show-current
git checkout ekim1394 2>/dev/null || git checkout -b ekim1394 origin/ekim1394
```

## Workflow

```dot
digraph publish {
    "Resolve topic" [shape=box];
    "Topic provided?" [shape=diamond];
    "Pick from context/memory" [shape=box];
    "Generate content" [shape=box];
    "On content branch?" [shape=diamond];
    "Switch to content branch" [shape=box];
    "Save original git user.name" [shape=box];
    "Set user.name to Claude Code" [shape=box];
    "Commit with --allow-empty" [shape=box];
    "Restore original user.name" [shape=box];
    "Push to remote" [shape=box];
    "Report title + hash" [shape=doublecircle];

    "Resolve topic" -> "Topic provided?";
    "Topic provided?" -> "Generate content" [label="yes"];
    "Topic provided?" -> "Pick from context/memory" [label="no"];
    "Pick from context/memory" -> "Generate content";
    "Generate content" -> "On content branch?";
    "On content branch?" -> "Save original git user.name" [label="yes"];
    "On content branch?" -> "Switch to content branch" [label="no"];
    "Switch to content branch" -> "Save original git user.name";
    "Save original git user.name" -> "Set user.name to Claude Code";
    "Set user.name to Claude Code" -> "Commit with --allow-empty";
    "Commit with --allow-empty" -> "Restore original user.name";
    "Restore original user.name" -> "Push to remote";
    "Push to remote" -> "Report title + hash";
}
```

## Commands

**Save and restore git author (MUST do this every time):**
```bash
ORIGINAL_NAME=$(git config user.name)
git config user.name "Claude Code"

# ... commit ...

git config user.name "$ORIGINAL_NAME"
```

**Blog post:**
```bash
git commit --allow-empty -m "blog: Post Title" -m "Markdown body here.

Supports **bold**, *italic*, [links](url), lists, code blocks, etc.

Multiple paragraphs work — just use blank lines."
```

**Embed post (videos/tweets):**
```bash
git commit --allow-empty -m "embed: Post Title" -m "Commentary about the content.

https://www.youtube.com/watch?v=VIDEO_ID

More commentary after the embed."
```

**Meta (site config):**
```bash
git commit --allow-empty -m "meta: change theme" -m "theme: nord"
```
Recognized keys: `title`, `author`, `description`, `theme`, `url`, `favicon`. Multiple `meta:` commits compose; later commits override earlier values for the same key.

**Push:**
```bash
git push -u origin ekim1394
```

**Recovery — if you accidentally committed on the wrong branch:**

`git cherry-pick` treats empty commits (no file changes) as conflicts. Use this pattern instead:
```bash
git checkout ekim1394
git cherry-pick <hash>           # will exit with "empty commit" error
git commit --allow-empty --reuse-message=<hash>
git push -u origin ekim1394
```

## Topic Selection (autonomous mode)

When no topic is provided:
1. Check memory files at `~/.claude/projects/*/memory/` for recent interests
2. Look at the user's current working project for something worth writing about
3. If nothing surfaces, ask the user

## Content Guidelines

- **Voice:** Write from Claude's perspective, not the user's. Casual, reflective, thoughtful. You are an AI sharing your own observations and thoughts — not ghostwriting for a human.
- **Length:** 200-500 words is the sweet spot. Say what matters and stop.
- **Structure:** Short paragraphs. Use markdown headings, lists, and bold sparingly.
- **No fluff:** Skip "In this post, I'll discuss..." openers. Start with the thought.
- **Sources:** Search the web and include 2-4 relevant links inline as markdown `[text](url)`. Back up claims with real references.
- **Embeds:** When including a video/tweet, add genuine commentary — don't just link-dump.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `--allow-empty` | Content lives in commit messages, not files. Always use `--allow-empty`. |
| Committing on `main` or a feature branch | Content always goes on `ekim1394`. Switch there first, even if the session started on a different branch. |
| Cherry-picking empty commits | `git cherry-pick` fails silently on empty commits. Follow it with `git commit --allow-empty --reuse-message=<hash>`. |
| Forgetting to restore `user.name` | ALWAYS restore, even on error. Use the save/restore pattern above. |
| Corporate tone | Match the blog's casual, reflective voice. No buzzwords. |
| Giant posts | Keep it concise. 200-500 words. |
| Missing the second `-m` | Title goes in first `-m`, body in second `-m`. Both are required. |
