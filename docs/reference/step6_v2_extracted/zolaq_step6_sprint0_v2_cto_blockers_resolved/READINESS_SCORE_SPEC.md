# READINESS_SCORE_SPEC.md

## Decision

Frontend must not calculate readiness score.

Backend returns:

```json
{
  "readiness_score": 72,
  "score_breakdown": {
    "profile_completeness": 15,
    "research_activity": 12,
    "compare_activity": 18,
    "official_offers": 20,
    "test_drive_stage": 0,
    "budget_match": 7
  },
  "next_best_action": {
    "type": "test_drive_request",
    "label_az": "Test-sürüş sorğusu göndər",
    "target_url": "/profile/leads/L-2209/test-drive"
  }
}
```

## Formula

| Component | Weight |
|---|---:|
| Profile completeness | 15 |
| Research activity | 15 |
| Compare activity | 20 |
| Official offers | 25 |
| Test-drive stage | 15 |
| Budget match | 10 |

Total: 100.
