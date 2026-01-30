#!/bin/bash
# Parallel AI Search wrapper for Windows/Git Bash
# Usage: ./parallel-search.sh "your search query"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Read API key directly from .env.local
API_KEY=$(grep "^PARALLEL_API_KEY=" "$PROJECT_ROOT/.env.local" 2>/dev/null | cut -d= -f2)

if [ -z "$API_KEY" ]; then
  echo "Error: PARALLEL_API_KEY not found in .env.local"
  exit 1
fi

QUERY="${1:-test}"

curl -s -X POST "https://api.parallel.ai/v1beta/search" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "parallel-beta: search-extract-2025-10-10" \
  -d "{\"objective\": \"$QUERY\"}"
