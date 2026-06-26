---
on:
  workflow_run:
    workflows: ["Copilot cloud agent"]
    types: [completed]
    branches: [main]
permissions:
  contents: read
  copilot-requests: write
safe-outputs:
  add-comment:
  create-issue:
engine: gemini
max-ai-credits: 200
---

# Investigate Failed Workflow

Only act if the workflow run conclusion is "failure".
If the workflow succeeded, do nothing.

Read the failed workflow logs carefully.
Identify why the workflow failed.
Create a new issue titled "Workflow Failed: [workflow name] - [date]" with:

- What failed
- The error message
- Suggested fix
