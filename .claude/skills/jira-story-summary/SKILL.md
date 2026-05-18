---
name: jira-story-summary
description: Use when the user asks for the summary, details, or information about a specific Jira story, ticket, or issue by ID (e.g. "what is PROJ-123", "show me AIEX-456", "get the summary of this story"). Also use when asked to look up subtasks, status, description, or assignee of a Jira issue.
---

# Jira Story Summary

## Overview

Fetch and display a structured summary of any Jira issue by key. Covers stories, subtasks, epics, and bugs.

## Steps

1. **Get Cloud ID** — call `getAccessibleAtlassianResources` (skip if already known in session)
2. **Fetch the issue** — call `getJiraIssue` with the issue key and these fields:
   ```
   ["summary", "status", "issuetype", "priority", "assignee", "description", "subtasks", "parent"]
   ```
3. **Format and display** the result (see Output Format below)

## Output Format

```
## [KEY] — [Summary]

| Field      | Value                  |
|------------|------------------------|
| Type       | Story / Subtask / Epic |
| Status     | To Do / In Progress / Done |
| Priority   | Medium                 |
| Assignee   | Name                   |
| Parent     | PROJ-123 (if subtask)  |

### Description
[First 3–5 sentences of description, or "No description."]

### Subtasks ([N] total)
| Key      | Summary               | Status      |
|----------|-----------------------|-------------|
| PROJ-124 | Do the thing          | Done        |
| PROJ-125 | Do the other thing    | To Do       |
```

Omit **Subtasks** section if none. Omit **Parent** row if not a subtask.

## Known Values (this project)

| Resource | Value |
|----------|-------|
| Cloud ID | `fb779f96-2443-4319-b441-63d66a63bbaf` |
| Site     | `emblaftdev.atlassian.net` |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping `getAccessibleAtlassianResources` when Cloud ID is unknown | Always call it first if no Cloud ID is in context |
| Displaying full raw description | Truncate to 3–5 sentences; raw ADF JSON is unreadable |
| Forgetting subtask statuses | Always include status for each subtask row |
