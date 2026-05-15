# INTERNAL_ADMIN_DATA_OPS.md

## Decision

Full customer-facing CRM/Admin UI is not part of MVP.

However, minimum internal data/admin operations are required for MVP. Without this, dealer offers, lead statuses, price validity and content cannot be operated.

## Minimum internal capabilities

1. Brand CRUD
2. Model CRUD
3. Year / Trim CRUD
4. CatalogPrice CRUD
5. Dealer CRUD
6. Dealer verification status update
7. DealerOfferData CRUD
8. valid_until management
9. Lead state update
10. Test-drive status update
11. Content CRUD for news / encyclopedia / Q&A
12. Source / verification / last_updated fields management
13. Audit log for all changes

## Internal role requirements

| Role | Permissions |
|---|---|
| admin | all internal operations |
| data_manager | brand/model/trim/catalog price/content |
| ops_manager | dealer/offer/lead/test-drive |
| verifier | dealer verification/status review |
| readonly | view only |

## Audit log required for

- Dealer verification update
- Offer amount update
- Offer valid_until update
- Lead state transition
- CatalogPrice update
- Content publish/archive
