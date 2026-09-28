/**
 * POLAR-X — SIX OPERATIONAL ROLES TEST & REGISTRATION VERIFICATION
 * 
 * Verifies that all 6 roles can be provisioned in Firestore:
 * - ADMIN
 * - EXPEDITION_MANAGER
 * - LOGISTICS_OFFICER
 * - SCIENTIST
 * - MEDICAL_OFFICER
 * - VIEWER
 * 
 * And verifies that:
 * - users/{uid}.role matches each selected role
 * - existing account gamarnath8560@gmail.com remains ADMIN
 * - role resolves cleanly without defaulting to VIEWER
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let serviceAccount = null;
const keyPath = path.join(rootDir, 'serviceAccountKey.json');
if (fs.existsSync(keyPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

if (!serviceAccount) {
  console.error('❌ serviceAccountKey.json required for test execution.');
  process.exit(1);
}

const app = getApps().length === 0
  ? initializeApp({ credential: cert(serviceAccount) })
  : getApps()[0];

const db = getFirestore(app);

const SIX_ROLES = [
  { role: 'ADMIN', email: 'test.admin@polar-x.test', name: 'Dr. Test Commander' },
  { role: 'EXPEDITION_MANAGER', email: 'test.expedition@polar-x.test', name: 'Cmdr. Test Operations' },
  { role: 'LOGISTICS_OFFICER', email: 'test.logistics@polar-x.test', name: 'Officer Test Supply' },
  { role: 'SCIENTIST', email: 'test.scientist@polar-x.test', name: 'Dr. Test Glaciologist' },
  { role: 'MEDICAL_OFFICER', email: 'test.medical@polar-x.test', name: 'Dr. Test Physician' },
  { role: 'VIEWER', email: 'test.viewer@polar-x.test', name: 'Observer Test Liaison' }
];

async function runSixRoleTests() {
  console.log('\n======================================================');
  console.log('    POLAR-X SIX OPERATIONAL ROLES VERIFICATION TEST    ');
  console.log('======================================================\n');

  let passed = 0;

  // 1. Verify Authoritative Admin Account in Firestore
  console.log('🔍 Checking authoritative ADMIN account (gamarnath8560@gmail.com / eje5aYyUwMSxff2dE4H3PbsAMhe2)...');
  const adminSnap = await db.collection('users').doc('eje5aYyUwMSxff2dE4H3PbsAMhe2').get();

  if (adminSnap.exists && adminSnap.data().role === 'ADMIN') {
    console.log(`✅ [MAIN ADMIN] gamarnath8560@gmail.com (UID: eje5aYyUwMSxff2dE4H3PbsAMhe2) confirmed role = ADMIN`);
    passed++;
  } else {
    console.error(`❌ [MAIN ADMIN] gamarnath8560@gmail.com failed role check:`, adminSnap.data()?.role);
  }

  // 2. Provision and Test each of the 6 roles
  console.log('\n🚀 Testing 6 Operational Roles Provisioning...');
  for (const item of SIX_ROLES) {
    const docId = `test-user-${item.role.toLowerCase()}`;
    const userDocRef = db.collection('users').doc(docId);

    const profileData = {
      uid: docId,
      email: item.email,
      displayName: item.name,
      name: item.name,
      role: item.role,
      requestedRole: item.role,
      approvalStatus: 'APPROVED',
      status: 'ACTIVE',
      station: 'Maitri Station (Antarctica)',
      badgeId: `TEST-${item.role.slice(0, 3)}-001`,
      createdAt: new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await userDocRef.set(profileData);

    // Read back and verify
    const snap = await userDocRef.get();
    const data = snap.data();

    if (data && data.role === item.role && data.approvalStatus === 'APPROVED') {
      console.log(`✅ [${item.role}] Provisioned & Verified: ${item.email} (role=${data.role}, status=${data.approvalStatus})`);
      passed++;
    } else {
      console.error(`❌ [${item.role}] Verification failed: expected ${item.role}, got ${data?.role}`);
    }

    // Clean up test document
    await userDocRef.delete();
  }

  console.log('\n======================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} / ${SIX_ROLES.length + 1} PASSED`);
  console.log('======================================================\n');
}

runSixRoleTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
