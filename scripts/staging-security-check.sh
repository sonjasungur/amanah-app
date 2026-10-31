#!/usr/bin/env bash
# Black-box security checks against a running staging instance (read-only requests).
#   BASE_URL=https://staging.<domain> ./scripts/staging-security-check.sh
#   Behind Caddy also: EXPECT_BASIC_AUTH=true EXPECT_HSTS=true
set -uo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3201}"
FAILED=0
ok() { echo "OK   $1"; }
bad() { echo "FAIL $1"; FAILED=1; }
AUTH=()
[[ -n "${STAGING_BASIC_AUTH:-}" ]] && AUTH=(-u "$STAGING_BASIC_AUTH")

if [[ "${EXPECT_BASIC_AUTH:-false}" == "true" ]]; then
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$BASE_URL/")"
  [[ "$code" == "401" ]] && ok "basic auth required without credentials" || bad "expected 401 without credentials, got $code"
fi

headers="$(curl -sI --max-time 10 "${AUTH[@]}" "$BASE_URL/")"
has() { grep -qi "^$1:" <<<"$headers"; }
has "content-security-policy" && ok "CSP header" || bad "CSP header missing"
grep -qi "^x-robots-tag:.*noindex" <<<"$headers" && ok "X-Robots-Tag noindex" || bad "X-Robots-Tag noindex missing"
grep -qi "^x-frame-options: *deny" <<<"$headers" && ok "X-Frame-Options DENY" || bad "X-Frame-Options missing"
has "x-powered-by" && bad "X-Powered-By exposed" || ok "no X-Powered-By"
if [[ "${EXPECT_HSTS:-false}" == "true" ]]; then has "strict-transport-security" && ok "HSTS" || bad "HSTS missing"; fi

robots="$(curl -s --max-time 10 "${AUTH[@]}" "$BASE_URL/robots.txt")"
grep -q "Disallow: /$" <<<"$robots" && ok "robots.txt disallows everything" || bad "robots.txt does not disallow everything"

curl -s --max-time 10 "${AUTH[@]}" "$BASE_URL/" | grep -q 'data-testid="staging-banner"' && ok "staging banner visible" || bad "staging banner missing"

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${AUTH[@]}" -X POST -H 'Content-Type: application/json' -H 'Origin: https://evil.invalid' \
  -d '{"email":"x@staging.invalid","password":"wrong-password"}' "$BASE_URL/api/auth/login")"
[[ "$code" == "403" ]] && ok "cross-origin login rejected" || bad "cross-origin login answered $code"

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${AUTH[@]}" -X POST -H 'Content-Type: application/json' -H "Origin: $BASE_URL" \
  -d '{"email":"probe@not-allowlisted.invalid","password":"long-enough-1","name":"x"}' "$BASE_URL/api/auth/register")"
[[ "$code" == "400" ]] && ok "only allow-listed domains can register" || bad "registration with a non-allow-listed domain answered $code"

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${AUTH[@]}" "$BASE_URL/api/amanah")"
[[ "$code" == "401" ]] && ok "folder API requires a session" || bad "folder API without session answered $code"

for path in /intern/vorsorge-plus /intern/pruefworkflow /wissen/redaktion /brand-review; do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${AUTH[@]}" "$BASE_URL$path")"
  [[ "$code" == "404" ]] && ok "internal page $path not reachable" || bad "internal page $path answered $code"
done

# The webhook is the only path open without Basic Auth: unsigned events must be refused
# (400 bad signature; 404 if billing is disabled).
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 -X POST -H 'Content-Type: application/json' \
  -H 'Stripe-Signature: t=1,v1=00' -d '{"id":"evt_probe","type":"checkout.session.completed"}' "$BASE_URL/api/billing/webhook")"
[[ "$code" == "400" || "$code" == "404" ]] && ok "unsigned webhook rejected ($code)" || bad "unsigned webhook answered $code"

exit "$FAILED"
