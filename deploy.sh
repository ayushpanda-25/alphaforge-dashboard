#!/bin/bash
# AlphaForge Dashboard — Deploy Script
# Copies latest engine output to public/data/ then builds for Vercel.
# Run this before pushing to GitHub for auto-deploy.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENGINE_OUTPUT="$SCRIPT_DIR/../alphaforge/output"

echo "=== AlphaForge Dashboard Deploy ==="

# Copy latest portfolio data
if [ -f "$ENGINE_OUTPUT/portfolio_latest.json" ]; then
  cp "$ENGINE_OUTPUT/portfolio_latest.json" "$SCRIPT_DIR/public/data/portfolio.json"
  echo "  Copied portfolio_latest.json"
else
  echo "  [WARN] No portfolio_latest.json found"
fi

# Copy flow data if available
if [ -f "$ENGINE_OUTPUT/flow_data.json" ]; then
  cp "$ENGINE_OUTPUT/flow_data.json" "$SCRIPT_DIR/public/data/flow.json"
  echo "  Copied flow_data.json"
else
  echo '{"available":false}' > "$SCRIPT_DIR/public/data/flow.json"
  echo "  No flow data — created placeholder"
fi

echo "  Data updated. Push to GitHub for Vercel deploy."
