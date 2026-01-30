#!/bin/bash
# Load environment variables from .env.local files
# Works on Windows Git Bash and Unix systems

# Function to load env file
load_env_file() {
  local env_file="$1"
  if [ -f "$env_file" ]; then
    # Export each line that matches KEY=VALUE pattern (skip comments and empty lines)
    while IFS='=' read -r key value; do
      # Skip comments and empty lines
      [[ "$key" =~ ^#.*$ ]] && continue
      [[ -z "$key" ]] && continue
      # Remove quotes from value
      value="${value%\"}"
      value="${value#\"}"
      value="${value%\'}"
      value="${value#\'}"
      # Export the variable
      export "$key=$value"
    done < "$env_file"
  fi
}

# Load from project root .env.local
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

load_env_file "$PROJECT_ROOT/.env.local"
load_env_file "$PROJECT_ROOT/next-app/.env.local"

echo "Environment loaded. PARALLEL_API_KEY length: ${#PARALLEL_API_KEY}"
