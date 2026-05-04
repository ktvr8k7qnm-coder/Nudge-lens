#!/bin/bash

echo "🚀 Starting deploy..."

git add .

git commit -m "auto deploy $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes"

git pull --rebase

git push origin main

echo "✅ Deploy complete"
