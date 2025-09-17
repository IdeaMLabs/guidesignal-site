# Firebase Service Account Setup Instructions

## 🔑 Required: Firebase Service Account Key

To run the test agent, you need to download a Firebase service account key:

### Steps:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your GuideSignal project**
3. **Navigate to Project Settings** (gear icon)
4. **Go to Service Accounts tab**
5. **Click "Generate new private key"**
6. **Save the downloaded JSON file as `serviceAccountKey.json` in this directory**

### ⚠️ Important Security Notes:
- **NEVER commit this file to version control**
- The `.gitignore` file is configured to ignore it
- This file contains sensitive credentials

### File Location:
```
testing/
├── serviceAccountKey.json  ← Save your key here
├── agent.js
├── firebase-admin-setup.js
└── ...
```

### Once you have the key:
```bash
npm test
```

This will run authentication tests for all three roles (student, jobseeker, recruiter).