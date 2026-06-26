---
on: issues
permissions:
  contents: read
  copilot-requests: write
safe-outputs:
  add-labels:
  add-comment:
engine: gemini
max-ai-credits: 200
---

# Triage Incoming Issues

Read the new issue title and description carefully.

Classify it as one of:

- bug → label: bug. If critical (crash/data loss) also add: priority: critical
- feature → label: feature. Add comment: "Thanks! Added to backlog."
- docs → label: docs. Assign to whoever last edited the relevant file.
- performance → label: performance

If the issue is missing reproduction steps or context,
add a comment asking the reporter for more detail.
