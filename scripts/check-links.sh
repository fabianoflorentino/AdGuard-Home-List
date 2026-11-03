#!/usr/bin/env bash
set -uo pipefail

mapfile -t urls < <(
  find allowlist/external allowlist/concat blocklist/external blocklist/concat \
    -type f -name '*.list' -print0 |
    xargs -0 grep -hoE 'https?://[^[:space:]]+' |
    sort -u
)

failures=0
checked=0

echo "Checking ${#urls[@]} upstream URLs..."
echo

for url in "${urls[@]}"; do
  checked=$((checked + 1))
  code=$(curl -L -s -o /dev/null -w '%{http_code}' --max-time 30 \
    -A 'AdGuard-Home-List/1.0' "$url" || true)

  if [[ "$code" =~ ^[23][0-9][0-9]$ ]]; then
    printf 'OK   %s  %s\n' "$code" "$url"
  else
    printf 'FAIL %s  %s\n' "${code:-000}" "$url"
    failures=$((failures + 1))
  fi
done

echo
echo "Checked $checked URLs; failures: $failures"

if [[ $failures -gt 0 ]]; then
  exit 1
fi
