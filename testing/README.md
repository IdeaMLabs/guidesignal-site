# GuideSignal Firebase Test Agent

Automates Firebase authentication testing for the GuideSignal platform. Tests user signup, verification, signin, and role-based redirects using Firebase Admin SDK.

## 🎯 What It Tests

- ✅ Firebase configuration validity
- ✅ User creation with Admin SDK
- ✅ Authentication with client SDK
- ✅ Role assignment and verification
- ✅ Firestore user document creation
- ✅ Role-based redirect mapping
- ✅ User data structure validation
- ✅ Cleanup of test users

## 🛠️ Setup

### Prerequisites
- Node.js v18+
- Firebase project with Authentication and Firestore enabled
- Firebase Admin SDK service account key

### Installation

1. **Navigate to testing directory:**
   ```bash
   cd testing
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Get Firebase service account key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your GuideSignal project
   - Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the downloaded JSON file as `serviceAccountKey.json` in this directory

### Configuration

The agent automatically uses the GuideSignal Firebase configuration:
- Project ID: `guidesignal`
- Auth Domain: `guidesignal.firebaseapp.com`
- Storage Bucket: `guidesignal.appspot.com`

## 🚀 Usage

### Test Individual Roles

```bash
# Test student role
npm run test:student
# or
node agent.js student

# Test recruiter role
npm run test:recruiter
# or
node agent.js recruiter

# Test job seeker role
npm run test:jobseeker
# or
node agent.js job_seeker
```

### Test All Roles

```bash
# Run complete test suite
npm test
# or
node agent.js all
```

## 📊 Expected Output

```
🔥 GuideSignal Firebase Authentication Test Agent
================================================
🔍 Testing Firebase configuration...
📋 Project ID: guidesignal
🌐 Auth Domain: guidesignal.firebaseapp.com
✅ Firebase client configuration appears valid

🚀 Testing student authentication flow...
==================================================
🔧 Creating test user for role: student
✅ Created Auth user with UID: abc123...
✅ Created Firestore document for user
🔄 Attempting to sign in with test-student-1a2b@guidesignal-test.local...
✅ Sign-in successful, UID: abc123...
📋 User role from Firestore: student
✅ Role verification successful: student
➡️  Expected redirect: student-dashboard.html
📊 User data validation:
   - Display Name: Test Student
   - Email Verified: true
   - Account Status: active
   - Profile Completed: true
🧹 Deleted test user: test-student-1a2b@guidesignal-test.local
```

## 🔧 Troubleshooting

### Common Issues

1. **"Failed to load serviceAccountKey.json"**
   - Download service account key from Firebase Console
   - Save as `serviceAccountKey.json` in testing directory

2. **"Firebase configuration test failed"**
   - Check internet connection
   - Verify Firebase project exists and is accessible

3. **"Permission denied" errors**
   - Ensure Firebase Authentication is enabled
   - Verify Firestore security rules allow admin access
   - Check service account has proper permissions

4. **"Configuration not found" errors**
   - Verify API key is correct
   - Check that authDomain matches project
   - Ensure project ID is correct

### Debug Mode

For detailed logging, set environment variable:
```bash
DEBUG=* node agent.js all
```

## 📁 File Structure

```
testing/
├── package.json              # Dependencies and scripts
├── agent.js                  # Main test agent
├── firebase-admin-setup.js   # Admin SDK initialization
├── firebase-client.js        # Client SDK for testing
├── serviceAccountKey.json    # Firebase service account (you provide)
└── README.md                 # This file
```

## 🎯 Role Mappings

The agent tests these role → redirect mappings:

| Role        | Expected Redirect          |
|-------------|----------------------------|
| `student`   | `student-dashboard.html`   |
| `job_seeker`| `dashboard.html`           |
| `recruiter` | `recruiter-dashboard.html` |

## 🧪 Test Data

Test users are created with:
- ✅ Email verification enabled
- ✅ Random email addresses (`test-{role}-{random}@guidesignal-test.local`)
- ✅ Secure password (`TestPassword123!`)
- ✅ Complete user profile
- ✅ Active account status
- 🧹 Automatic cleanup after testing

## 🔒 Security Notes

- Test users are automatically deleted after each test
- Service account key should never be committed to version control
- Test emails use `.local` domain to avoid conflicts
- Admin SDK is only used for testing purposes