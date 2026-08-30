# Upgrade ascension balance

## Scope

This record covers the treatment-specific upgrade costs and signature mechanics
introduced on 2026-08-30.

## Cost model

- Each treatment path costs `round(placement cost * 0.7)`, then `1.25`, then
  `2.1`.
- Every full path costs more than three times the treatment placement cost.
- The Doctor totals 63, 113, and 189 TP. Its first two upgrades remain close to
  the previous early-campaign values.

## Campaign check

- Fibrotic Sieve now enters with 1,500 TP from its 500 TP carryover cap plus
  1,000 TP reinforcement. Its prior 960 TP entry no longer supported the
  constrained mixed defense after treatment-specific upgrade costs replaced the
  global list.
- The deterministic mixed-defense fixture resolves Level 8. The complete Node
  simulation suite also resolves the campaign balance layouts through Level 10.

## Guardrails

- Signatures have one bounded rule each and do not multiply another signature.
- Placement remains a live alternative to upgrading: no signature changes route
  scheduling or path geometry.
