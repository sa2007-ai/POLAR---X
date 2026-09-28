/**
 * POLAR-X — ONE-TIME INITIAL ADMIN BOOTSTRAP SCRIPT
 * 
 * Secure, explicit administrative script to bootstrap the initial POLAR-X ADMIN
 * using Firebase Admin SDK in a trusted server environment.
 * 
 * Safety & Security Guarantees:
 * - Modular Firebase Admin SDK imports (firebase-admin v14+)
 * - Requires explicit execution from command line with --email or --uid
 * - Targets only the specified Firebase UID or email
 * - Never modifies other user profiles
 * - Never runs during normal login or registration flows
 * - Does not weaken or modify client-side Firestore security rules
 * - Creates an append-only audit record in `activityLogs`
 * 
 * Usage:
 *   node scripts/bootstrap-admin.mjs --email <admin_email> [--serviceAccount <path_to_key.json>] [--yes]
 *   node scripts/bootstrap-admin.mjs --uid <firebase_uid> [--serviceAccount <path_to_key.json>] [--yes]
 *   node scripts/bootstrap-admin.mjs --help
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Modular Firebase Admin SDK imports
import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Command-line Argument Parsing
const args = process.argv.slice(2);

const hasFlag = (flag, alias) => args.includes(flag) || (alias && args.includes(alias));
const getArg = (flag, alias) => {
  const idx = args.indexOf(flag) !== -1 ? args.indexOf(flag) : (alias ? args.indexOf(alias) : -1);
  if (idx !== -1 && idx + 1 < args.length && !args[idx + 1].startsWith('-')) {
    return args[idx + 1];
  }
  return null;
};

if (hasFlag('--help', '-h')) {
  console.log(`
POLAR-X Command Administration — Initial Admin Bootstrap Tool

Usage:
  node scripts/bootstrap-admin.mjs --email <email> [options]
  node scripts/bootstrap-admin.mjs --uid <uid> [options]
  npm run bootstrap:admin -- --email <email> [options]

Required Options (provide one or both matching):
  --email <email>             Target user email registered in Firebase Authentication
  --uid <uid>                 Target user UID registered in Firebase Authentication

Additional Options:
  --serviceAccount <path>     Path to Firebase Service Account JSON key file
  --key <path>                Alias for --serviceAccount
  -y, --yes                   Skip interactive confirmation prompt
  -h, --help                  Show this help guide

Credentials Priority:
  1. --serviceAccount / --key argument
  2. serviceAccountKey.json in project root
  3. GOOGLE_APPLICATION_CREDENTIALS environment variable
  4. Application Default Credentials (ADC)
`);
  process.exit(0);
}

const targetEmail = getArg('--email');
const targetUid = getArg('--uid');
const serviceAccountPathArg = getArg('--serviceAccount') || getArg('--key');
const autoConfirm = hasFlag('--yes', '-y');

if (!targetEmail && !targetUid) {
  console.error('\n❌ [BOOTSTRAP ERROR] Target user identifier missing.');
  console.error('Usage:');
  console.error('  npm run bootstrap:admin -- --email <user@example.com>');
  console.error('  npm run bootstrap:admin -- --uid <firebase_auth_uid>');
  console.error('\nFor all options, run: node scripts/bootstrap-admin.mjs --help\n');
  process.exit(1);
}

// 2. Resolve Service Account & Admin Credentials
let credentialMethod = 'NONE';
let credentialObj = null;
let resolvedKeyPath = null;

const candidateKeyPaths = [
  serviceAccountPathArg,
  process.env.FIREBASE_SERVICE_ACCOUNT,
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  path.join(rootDir, 'serviceAccountKey.json'),
  path.join(rootDir, 'polar-x-service-account.json'),
  path.join(rootDir, 'credentials.json'),
].filter(Boolean);

for (const candidate of candidateKeyPaths) {
  const resolved = path.isAbsolute(candidate) ? candidate : path.resolve(rootDir, candidate);
  if (fs.existsSync(resolved)) {
    try {
      const raw = fs.readFileSync(resolved, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.type === 'service_account' || parsed.private_key) {
        credentialObj = cert(parsed);
        credentialMethod = 'SERVICE_ACCOUNT_KEY';
        resolvedKeyPath = resolved;
        break;
      }
    } catch (parseErr) {
      console.warn(`⚠️ Failed to parse service account JSON from ${resolved}:`, parseErr.message);
    }
  }
}

if (!credentialObj) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCLOUD_PROJECT) {
    try {
      credentialObj = applicationDefault();
      credentialMethod = 'APPLICATION_DEFAULT_CREDENTIALS';
    } catch {
      // Fall through to error
    }
  }
}

// Read .env project ID as fallback for initialization config
let envProjectId = undefined;
try {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('VITE_FIREBASE_PROJECT_ID=')) {
        envProjectId = trimmed.split('=')[1]?.trim();
      }
    }
  }
} catch {
  // Ignore .env read errors
}

// 3. Prompt Confirmation Helper
function askConfirmation(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      const normalized = ans.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

// 4. Main Bootstrap Execution
async function runBootstrap() {
  console.log('\n======================================================');
  console.log('       POLAR-X ONE-TIME INITIAL ADMIN BOOTSTRAP       ');
  console.log('======================================================\n');

  if (!credentialObj) {
    console.error('❌ [CREDENTIAL ERROR] No Firebase Service Account private key or ADC credentials found.');
    console.error('\nTo bootstrap an ADMIN account in a secure, trusted environment:');
    console.error('1. Go to Firebase Console -> Project Settings -> Service accounts');
    console.error('2. Click "Generate new private key"');
    console.error('3. Save the downloaded JSON file as "serviceAccountKey.json" in the project root:');
    console.error(`   ${path.join(rootDir, 'serviceAccountKey.json')}`);
    console.error('4. Re-run:');
    console.error(`   npm run bootstrap:admin -- --email ${targetEmail || '<your-email>'}\n`);
    console.error('Security Notice: serviceAccountKey.json is in .gitignore and will never be committed.\n');
    process.exit(1);
  }

  // Initialize Firebase Admin exactly once
  let app;
  if (getApps().length === 0) {
    app = initializeApp({
      credential: credentialObj,
      projectId: envProjectId,
    });
  } else {
    app = getApps()[0];
  }

  console.log(`🔑 Credential Method: ${credentialMethod}`);
  if (resolvedKeyPath) {
    console.log(`📁 Key File:         ${path.basename(resolvedKeyPath)}`);
  }
  console.log(`🌐 Project ID:        ${app.options.projectId || envProjectId || 'auto-detected'}\n`);

  const auth = getAuth(app);
  const db = getFirestore(app);

  // 5. Look up User in Firebase Auth
  console.log(`🔍 Locating target account in Firebase Authentication...`);
  let userRecord = null;

  try {
    if (targetUid && targetEmail) {
      const byUid = await auth.getUser(targetUid);
      const byEmail = await auth.getUserByEmail(targetEmail);
      if (byUid.uid !== byEmail.uid) {
        console.error(`❌ [MISMATCH ERROR] --uid (${targetUid}) and --email (${targetEmail}) refer to different accounts!`);
        process.exit(1);
      }
      userRecord = byUid;
    } else if (targetUid) {
      userRecord = await auth.getUser(targetUid);
    } else if (targetEmail) {
      userRecord = await auth.getUserByEmail(targetEmail);
    }
  } catch (authErr) {
    console.error(`\n❌ [AUTH LOOKUP FAILED] Target user not found in Firebase Authentication.`);
    console.error(`   Identifier: ${targetEmail || targetUid}`);
    console.error(`   Error:      ${authErr.message}`);
    console.error('\nPlease verify that you have registered this account in Firebase Authentication before bootstrapping.\n');
    process.exit(1);
  }

  const authoritativeUid = userRecord.uid;
  const authoritativeEmail = userRecord.email || targetEmail;
  const displayName = userRecord.displayName || authoritativeEmail?.split('@')[0] || 'Command Officer';

  console.log(`✅ Authoritative Account Verified:`);
  console.log(`   UID:          ${authoritativeUid}`);
  console.log(`   Email:        ${authoritativeEmail}`);
  console.log(`   Display Name: ${displayName}`);

  // 6. Inspect existing Firestore Profile
  const userDocRef = db.collection('users').doc(authoritativeUid);
  const userDocSnap = await userDocRef.get();

  let existingData = {};
  let isAlreadyAdmin = false;

  if (userDocSnap.exists) {
    existingData = userDocSnap.data();
    console.log(`\n📋 Current Firestore Profile (users/${authoritativeUid}):`);
    console.log(`   Current Role:    ${existingData.role || 'NONE'}`);
    console.log(`   Station:         ${existingData.station || 'NONE'}`);
    console.log(`   Badge ID:        ${existingData.badgeId || 'NONE'}`);
    console.log(`   Account Status:  ${existingData.status || 'ACTIVE'}`);

    if (existingData.role === 'ADMIN') {
      isAlreadyAdmin = true;
      console.log('\nℹ️ [IDEMPOTENCY NOTICE] This account is ALREADY configured with role = ADMIN.');
    }
  } else {
    console.log(`\n📋 No existing Firestore profile document found. A new ADMIN profile will be created.`);
  }

  // 7. Safety Confirmation Check
  if (!autoConfirm) {
    const promptMsg = isAlreadyAdmin
      ? `\nRe-apply ADMIN bootstrap configuration for ${authoritativeEmail} (${authoritativeUid})? (y/N): `
      : `\nElevate user ${authoritativeEmail} (${authoritativeUid}) to role ADMIN? (y/N): `;

    const confirmed = await askConfirmation(promptMsg);
    if (!confirmed) {
      console.log('\n🛑 Bootstrap aborted by user. No modifications were made.\n');
      process.exit(0);
    }
  }

  // 8. Apply Role Elevation in Firestore
  const nowIso = new Date().toISOString();
  const updatedProfile = {
    uid: authoritativeUid,
    email: authoritativeEmail,
    name: existingData.name || displayName,
    role: 'ADMIN',
    requestedRole: 'ADMIN',
    approvalStatus: 'APPROVED',
    badgeId: existingData.badgeId || 'NCPOR-CMD-001',
    station: existingData.station || 'Maitri Station (Antarctica)',
    department: existingData.department || 'Command & Operations',
    status: 'ACTIVE',
    createdAt: existingData.createdAt || nowIso,
    updatedAt: FieldValue.serverTimestamp(),
  };

  console.log(`\n🚀 Writing ADMIN profile to users/${authoritativeUid}...`);
  await userDocRef.set(updatedProfile, { merge: true });
  console.log(`✅ Profile successfully saved with role = ADMIN.`);

  // 9. Append Audit Record to activityLogs
  const logId = `LOG-BOOTSTRAP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const auditRecord = {
    id: logId,
    timestamp: FieldValue.serverTimestamp(),
    module: 'security',
    action: 'INITIAL_ADMIN_BOOTSTRAP',
    details: `Initial POLAR-X administrative bootstrap executed. Account ${authoritativeEmail} (${authoritativeUid}) clearance set to ADMIN.`,
    severity: 'warning',
    user: 'SYSTEM_BOOTSTRAP',
    actorUid: 'SYSTEM_BOOTSTRAP',
    targetUid: authoritativeUid,
    previousRole: existingData.role || 'NONE',
    newRole: 'ADMIN',
  };

  console.log(`📝 Writing audit log record to activityLogs/${logId}...`);
  await db.collection('activityLogs').doc(logId).set(auditRecord);
  console.log(`✅ Audit log successfully created.`);

  console.log('\n======================================================');
  console.log('       ADMIN BOOTSTRAP COMPLETED SUCCESSFULLY         ');
  console.log('======================================================');
  console.log(`Target UID:      ${authoritativeUid}`);
  console.log(`Target Email:    ${authoritativeEmail}`);
  console.log(`Assigned Role:   ADMIN`);
  console.log(`Station:         ${updatedProfile.station}`);
  console.log(`Badge ID:        ${updatedProfile.badgeId}`);
  console.log(`Audit Log ID:    ${logId}`);
  console.log('\nNext Steps:');
  console.log('1. In your browser, log out if currently logged in.');
  console.log('2. Log back in with the bootstrapped account.');
  console.log('3. AuthContext will load role = ADMIN from Firestore.');
  console.log('4. User Management menu item and ADMIN badge will be visible.');
  console.log('======================================================\n');
}

runBootstrap().catch((err) => {
  console.error('\n❌ [BOOTSTRAP EXECUTION FAILED]', err.message || err);
  process.exit(1);
});
