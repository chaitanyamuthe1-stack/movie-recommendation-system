#!/usr/bin/env bash
# Simple pre-publish secret scan. Exits 1 if anything suspicious is found.
set -u
fail=0
echo "Scanning tracked files for likely secrets..."

patterns=(
  'api_key=[0-9a-f]{32}'
  'TMDB_KEY *= *"[0-9a-f]{32}"'
  'sk-[A-Za-z0-9]{20,}'
  'AKIA[0-9A-Z]{16}'
  'JWT_SECRET_KEY *[:=] *[^$ ]*prod'
  'POSTGRES_PASSWORD *[:=] *[A-Za-z0-9]+$'
  'postgresql://[^:]+:[^@$]+@'
)
files=$(git ls-files 2>/dev/null || find . -type f -not -path './.git/*' -not -path '*/node_modules/*')

for p in "${patterns[@]}"; do
  hits=$(echo "$files" | grep -v -E '(\.env\.example|check_secrets\.sh|\.md)$' | xargs grep -n -E -- "$p" 2>/dev/null)
  if [ -n "$hits" ]; then
    echo "!! Pattern: $p"; echo "$hits"; fail=1
  fi
done

for f in .env recommender.db; do
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    echo "!! $f is tracked by git - remove it with: git rm --cached $f"; fail=1
  fi
done

[ $fail -eq 0 ] && echo "OK: no obvious secrets found." || echo "Fix the items above before publishing."
exit $fail
