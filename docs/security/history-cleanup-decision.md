# History cleanup decision — amanah-app

**No history rewrite is authorized by this document alone.**

## Option A — Rotation without history rewrite

Suitable when:

- the credential was fully revoked
- operational risk of force-push is higher than residual git history risk
- no regulator mandates purge from git history

## Option B — Coordinated history cleanup

Possible tools later: `git filter-repo` (BFG only with clear justification).

Required before any rewrite:

1. all affected credentials rotated
2. full repository backup
3. agreed maintenance window
4. all developers notified
5. open branches and MRs protected
6. tags/releases reviewed
7. GitHub and GitLab mirrors reviewed
8. CI caches reviewed
9. artifacts reviewed
10. all workspaces re-cloned after rewrite
11. explicit management approval

## Recommendation for this repository

`OPTIONAL_AFTER_ROTATION`

