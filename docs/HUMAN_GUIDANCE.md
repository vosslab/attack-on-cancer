# HUMAN_GUIDANCE.md

## Agent instruction style

- Use positive, action-led prompts such as "Use Y" and "Implement X."
- Omit unrelated tools, actions, and prohibitions when the desired scope is clear.
- Write subagent tasks with an owned artifact, intended behavior, and verification command.
- State explicit exclusion boundaries only when they protect safety, correctness, or scope.
- Treat pre-production repositories as an opportunity to improve ownership, schemas, and contracts;
  replace legacy structures with the canonical design rather than preserving compatibility layers.
