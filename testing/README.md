# GuideSignal Test Agent

Automates signup → verification → signin → redirect testing using Firebase Admin SDK.

## Setup
1. Install Node.js v18+.
2. Run `npm install`.
3. Download Firebase service account JSON → save as `serviceAccountKey.json`.

## Usage
Run tests for each role:

```bash
node agent.js student
node agent.js jobseeker
node agent.js recruiter
node agent.js all   # run all three
```

## Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your GuideSignal project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Save the downloaded JSON file as `serviceAccountKey.json` in this directory

⚠️ **Never commit the service account key to version control!**

## What It Tests

- Creates test users with Firebase Admin SDK
- Tests authentication with Firebase client SDK
- Verifies user roles are correctly assigned
- Checks expected redirect mappings
- Cleans up test users automatically

## Expected Redirects

| Role      | Redirect Page            |
|-----------|--------------------------|
| student   | student-dashboard.html   |
| jobseeker | dashboard.html           |
| recruiter | recruiter-dashboard.html |