#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔥 GuideSignal Firebase Test Agent Setup');
console.log('=========================================\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error(`❌ Node.js v18+ required. Current: ${nodeVersion}`);
  console.log('Please upgrade Node.js: https://nodejs.org/');
  process.exit(1);
}
console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if package.json exists
const packagePath = join(__dirname, 'package.json');
if (!existsSync(packagePath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}
console.log('✅ package.json found');

// Check if dependencies are installed
const nodeModulesPath = join(__dirname, 'node_modules');
if (!existsSync(nodeModulesPath)) {
  console.log('📦 Dependencies not installed. Run:');
  console.log('   cd testing && npm install');
} else {
  console.log('✅ Dependencies installed');
}

// Check for service account key
const serviceKeyPath = join(__dirname, 'serviceAccountKey.json');
if (!existsSync(serviceKeyPath)) {
  console.log('\n🔑 SETUP REQUIRED: Firebase Service Account Key');
  console.log('================================================');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.log('2. Select your GuideSignal project');
  console.log('3. Project Settings → Service Accounts');
  console.log('4. Click "Generate new private key"');
  console.log('5. Save the downloaded JSON as "serviceAccountKey.json" in this directory');
  console.log('\n⚠️  NEVER commit this file to version control!');
} else {
  try {
    const serviceKey = JSON.parse(readFileSync(serviceKeyPath, 'utf8'));
    if (serviceKey.project_id === 'guidesignal') {
      console.log('✅ Service account key found and validated');
    } else {
      console.warn(`⚠️  Service account project_id is "${serviceKey.project_id}", expected "guidesignal"`);
    }
  } catch (error) {
    console.error('❌ Invalid service account key JSON');
  }
}

// Show next steps
console.log('\n🚀 NEXT STEPS');
console.log('=============');

if (!existsSync(nodeModulesPath)) {
  console.log('1. Install dependencies:');
  console.log('   npm install');
  console.log('');
}

if (!existsSync(serviceKeyPath)) {
  console.log('2. Add Firebase service account key (see instructions above)');
  console.log('');
}

console.log('3. Run tests:');
console.log('   npm test           # Test all roles');
console.log('   npm run test:student    # Test student role');
console.log('   npm run test:recruiter  # Test recruiter role');
console.log('   npm run test:jobseeker  # Test job seeker role');

console.log('\n📚 Documentation: ./README.md');
console.log('🔧 Troubleshooting: Check README.md for common issues');

// Check Firebase project status
console.log('\n🔍 Firebase Project Verification');
console.log('=================================');
console.log('Project ID: guidesignal');
console.log('Auth Domain: guidesignal.firebaseapp.com');
console.log('Storage Bucket: guidesignal.appspot.com');
console.log('\nEnsure these services are enabled:');
console.log('• Authentication (Email/Password provider)');
console.log('• Firestore Database');
console.log('• Admin SDK access');