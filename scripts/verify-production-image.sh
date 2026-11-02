#!/usr/bin/env bash
# Read-only check: does production run exactly the pinned image, with the route still closed?
# Run on the server. Prints no configuration values. Exit 0 only if everything fits.
set -u
EXPECTED="sha256:f7f29e2ac4ef5db126d3e280f0dc4c01b6108a713d51474fad151684e1858d75"
ROLLBACK="sha256:ec6e55a2bda27dc4e5bbab0031bea3e5df24044fba6bb20a347b7a3037dd4f8e"
failed=0
check() { if [ "$2" = "$3" ]; then echo "OK   $1"; else echo "FAIL $1"; failed=1; fi; }

check "running image is the pinned one" "$(docker inspect amanah-app --format '{{.Image}}' 2>/dev/null)" "$EXPECTED"
check "container is healthy" "$(docker inspect amanah-app --format '{{.State.Health.Status}}' 2>/dev/null)" "healthy"
check "pinned image is present" "$(docker image inspect "$EXPECTED" --format '{{.Id}}' 2>/dev/null)" "$EXPECTED"
check "rollback image is present" "$(docker image inspect "$ROLLBACK" --format '{{.Id}}' 2>/dev/null)" "$ROLLBACK"
check "proxy has no Amanah route" "$(docker exec gemeinsam1-prod-caddy wget -qO- http://127.0.0.1:2019/config/ 2>/dev/null | grep -c amanah)" "0"
check "drafts stay locked" "$(curl -s -o /dev/null -m 8 -w '%{http_code}' http://127.0.0.1:3001/api/knowledge/entries)" "404"
exit "$failed"
