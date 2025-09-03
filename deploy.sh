#!/bin/bash
# GuideSignal Deployment Script

# Exit on error
set -e

echo "Applying GuideSignal fixes..."

# Ensure we're in the project root
cd "$(dirname "$0")"

# Copy style.css into main CSS folder (adjust path if needed)
cp style.css ./css/style.css

# Reminder to manually update auth.html with auth_snippet.html contents
echo ">>> IMPORTANT: Open auth.html and replace the role selection section with code from auth_snippet.html"

# Stage changes
git add .

# Commit with message
git commit -m "Applied global readability fixes + updated role selection with radio buttons"

# Push to GitHub
git push origin main

echo "Deployment complete! Verify live at https://guide-signal.com"
