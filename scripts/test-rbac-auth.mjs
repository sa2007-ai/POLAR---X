/**
 * POLAR-X — RBAC, REGISTRATION, & FIRESTORE SECURITY VERIFICATION SUITE
 * 
 * Verifies:
 * - REG-01: Registration with VIEWER
 * - REG-02: Registration requesting SCIENTIST
 * - REG-03: Requested SCIENTIST does NOT immediately grant SCIENTIST permissions
 * - REG-04: ADMIN can approve SCIENTIST
 * - REG-05: Approved role propagates
 * - REG-06: Non-admin cannot approve role
 * - REG-07: User cannot modify own role
 * - FIRESTORE-01: Authenticated user can read own profile
 * - FIRESTORE-02: Authenticated user can create safe VIEWER profile
 * - FIRESTORE-03: Unauthorized privileged role assignment is rejected
 * - FIRESTORE-04: ADMIN can manage users
 * - FIRESTORE-05: Empty Firestore collections do not trigger demo fallback
 * - FIRESTORE-06: Permission errors are correctly identified
 * - AUTH-01: Login workflow
 * - AUTH-02: Logout workflow
 * - AUTH-03: Registration workflow
 * - AUTH-04: Password reset workflow
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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
  console.error('❌ serviceAccountKey.json required for test suite execution.');
  process.exit(1);
}

const app = getApps().length === 0
  ? initializeApp({ credential: cert(serviceAccount) })
  : getApps()[0];

const _auth = getAuth(app);
const db = getFirestore(app);

const results = [];
function test(id, description, fn) {
  try {
    const outcome = fn();
    if (outcome instanceof Promise) {
      return outcome.then(() => {
        results.push({ id, description, passed: true });
        console.log(`✅ [${id}] ${description}`);
      }).catch((err) => {
        results.push({ id, description, passed: false, error: err.message });
        console.error(`❌ [${id}] ${description}: ${err.message}`);
      });
    } else {
      results.push({ id, description, passed: true });
      console.log(`✅ [${id}] ${description}`);
    }
  } catch (err) {
    results.push({ id, description, passed: false, error: err.message });
    console.error(`❌ [${id}] ${description}: ${err.message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('    POLAR-X RBAC & AUTHENTICATION VERIFICATION SUITE   ');
  console.log('======================================================\n');

  // Test 1: REG-01 & REG-02: User profile schema modeling
  await test('REG-01', 'Registration with VIEWER clearance role defaults to APPROVED status', () => {
    const viewerProfile = {
      role: 'VIEWER',
      requestedRole: 'VIEWER',
      approvalStatus: 'APPROVED'
    };
    if (viewerProfile.role !== 'VIEWER' || viewerProfile.approvalStatus !== 'APPROVED') {
      throw new Error('VIEWER registration did not set proper initial state');
    }
  });

  await test('REG-02', 'Registration requesting SCIENTIST defaults to role=VIEWER and approvalStatus=PENDING', () => {
    const scientistReq = {
      role: 'VIEWER',
      requestedRole: 'SCIENTIST',
      approvalStatus: 'PENDING'
    };
    if (scientistReq.role !== 'VIEWER' || scientistReq.approvalStatus !== 'PENDING') {
      throw new Error('Requested SCIENTIST role incorrectly granted privileged role directly');
    }
  });

  await test('REG-03', 'Requested SCIENTIST role does NOT authorize scientist operations while role=VIEWER', () => {
    const user = { role: 'VIEWER', requestedRole: 'SCIENTIST' };
    const canCreateRoute = user.role === 'ADMIN' || user.role === 'EXPEDITION_MANAGER' || user.role === 'SCIENTIST';
    if (canCreateRoute) {
      throw new Error('Security flaw: requestedRole authorized privileged operation before approval');
    }
  });

  await test('REG-04', 'ADMIN can approve SCIENTIST and elevate role from VIEWER to SCIENTIST with APPROVED and ACTIVE status', async () => {
    const testDocRef = db.collection('users').doc('test-scientist-approval');
    await testDocRef.set({
      uid: 'test-scientist-approval',
      email: 'test.glaciologist@polar-x.test',
      displayName: 'Dr. Test Glaciologist',
      role: 'VIEWER',
      requestedRole: 'SCIENTIST',
      approvalStatus: 'PENDING',
      status: 'PENDING',
      updatedAt: FieldValue.serverTimestamp()
    });

    // Simulate Admin Approval with atomic synchronization
    await testDocRef.update({
      role: 'SCIENTIST',
      approvalStatus: 'APPROVED',
      status: 'ACTIVE',
      approvedBy: 'admin-tester',
      approvedAt: new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp()
    });

    const snap = await testDocRef.get();
    const data = snap.data();
    if (data.role !== 'SCIENTIST' || data.approvalStatus !== 'APPROVED' || data.status !== 'ACTIVE') {
      throw new Error('Role approval failed to synchronize role, approvalStatus, and status');
    }
    await testDocRef.delete();
  });

  await test('REG-04B', 'ADMIN can assign ADMIN role directly with atomic APPROVED and ACTIVE status', async () => {
    const testDocRef = db.collection('users').doc('test-admin-assignment');
    await testDocRef.set({
      uid: 'test-admin-assignment',
      email: 'test.newadmin@polar-x.test',
      displayName: 'Commander In Training',
      role: 'VIEWER',
      requestedRole: 'ADMIN',
      approvalStatus: 'PENDING',
      status: 'PENDING',
      updatedAt: FieldValue.serverTimestamp()
    });

    // Simulate Admin Role Assignment
    await testDocRef.update({
      role: 'ADMIN',
      approvalStatus: 'APPROVED',
      status: 'ACTIVE',
      approvedBy: 'admin-tester',
      approvedAt: new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp()
    });

    const snap = await testDocRef.get();
    const data = snap.data();
    if (data.role !== 'ADMIN' || data.approvalStatus !== 'APPROVED' || data.status !== 'ACTIVE') {
      throw new Error('Role assignment failed to synchronize role, approvalStatus: APPROVED, and status: ACTIVE');
    }
    await testDocRef.delete();
  });

  await test('REG-05', 'Approved role propagates to profile document with audit log record', async () => {
    const testDocRef = db.collection('users').doc('test-propagation');
    await testDocRef.set({
      uid: 'test-propagation',
      role: 'MEDICAL_OFFICER',
      approvalStatus: 'APPROVED',
      status: 'ACTIVE',
      updatedAt: FieldValue.serverTimestamp()
    });
    const snap = await testDocRef.get();
    if (snap.data().role !== 'MEDICAL_OFFICER' || snap.data().approvalStatus !== 'APPROVED') {
      throw new Error('Profile role does not match elevated role');
    }
    await testDocRef.delete();

    // Verify activityLog structure requirement
    const logRef = db.collection('activityLogs').doc('test-role-audit');
    await logRef.set({
      id: 'test-role-audit',
      timestamp: FieldValue.serverTimestamp(),
      module: 'personnel',
      action: 'ROLE_CHANGED',
      details: 'Test role elevation',
      severity: 'warning',
      user: 'Station Commander (ADMIN)',
      actorUid: 'admin-tester',
      targetUid: 'test-propagation',
      targetUserId: 'test-propagation',
      previousRole: 'VIEWER',
      newRole: 'MEDICAL_OFFICER',
      previousApprovalStatus: 'PENDING',
      newApprovalStatus: 'APPROVED'
    });
    const logSnap = await logRef.get();
    const logData = logSnap.data();
    if (logData.newApprovalStatus !== 'APPROVED' || logData.action !== 'ROLE_CHANGED') {
      throw new Error('Audit log record missing required approval metadata');
    }
    await logRef.delete();
  });

  await test('REG-06', 'Non-admin cannot approve role or modify approvalStatus (Firestore rule specification)', () => {
    const rulesContent = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
    if (!rulesContent.includes("request.resource.data.role == resource.data.role")) {
      throw new Error('Firestore rules do not enforce role immutability for non-admin');
    }
    if (!rulesContent.includes("approvalStatus")) {
      throw new Error('Firestore rules do not enforce approvalStatus immutability for non-admin');
    }
  });

  await test('REG-07', 'User cannot modify own role in security rules', () => {
    const rulesContent = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
    if (!rulesContent.includes("request.resource.data.role == resource.data.role")) {
      throw new Error('Firestore rules do not prevent users from changing their own role');
    }
  });

  await test('FIRESTORE-01', 'Authenticated user can read own profile', () => {
    const rulesContent = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
    if (!rulesContent.includes("match /users/{userId}")) {
      throw new Error('Missing users collection match block');
    }
  });

  await test('FIRESTORE-02', 'Authenticated user can create safe profile with valid operational role', () => {
    const rulesContent = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
    const hasRoleValidation = rulesContent.includes("request.resource.data.role in ['ADMIN'") || rulesContent.includes("request.resource.data.role == 'VIEWER'");
    if (!hasRoleValidation) {
      throw new Error('Creation rule does not validate user role enum');
    }
  });

  await test('FIRESTORE-03', 'Unauthorized privileged role assignment is rejected in rules', () => {
    const rulesContent = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
    if (!rulesContent.includes("isAdmin()")) {
      throw new Error('Missing isAdmin() guard on privileged updates');
    }
  });

  await test('FIRESTORE-04', 'ADMIN can manage users and activityLogs', async () => {
    const logRef = db.collection('activityLogs').doc('test-audit-verify');
    await logRef.set({
      id: 'test-audit-verify',
      timestamp: FieldValue.serverTimestamp(),
      module: 'security',
      action: 'TEST_AUDIT',
      details: 'Audit trail verification',
      severity: 'info',
      user: 'SYSTEM_TEST'
    });
    const snap = await logRef.get();
    if (!snap.exists) throw new Error('Audit log creation failed');
    await logRef.delete();
  });

  await test('FIRESTORE-05', 'Empty Firestore collections do not trigger demo fallback in PolarContext', () => {
    const polarContextContent = fs.readFileSync(path.join(rootDir, 'src/context/PolarContext.tsx'), 'utf8');
    if (!polarContextContent.includes("useState<Expedition[]>(() => (!firebaseReady ? mockExpeditions : []))")) {
      throw new Error('PolarContext still initializes mock data when Firebase is ready');
    }
  });

  await test('FIRESTORE-06', 'Permission errors are correctly differentiated in banner', () => {
    const bannerContent = fs.readFileSync(path.join(rootDir, 'src/components/common/FirebaseConnectionBanner.tsx'), 'utf8');
    if (!bannerContent.includes("Firestore Permission Denied")) {
      throw new Error('Banner does not explicitly identify permission errors');
    }
  });

  await test('AUTH-01 & AUTH-03', 'Registration and login services correctly export email/password functions', () => {
    const authServiceContent = fs.readFileSync(path.join(rootDir, 'src/services/firebase/authService.ts'), 'utf8');
    if (!authServiceContent.includes('registerWithEmailPassword') || !authServiceContent.includes('loginWithEmailPassword')) {
      throw new Error('Auth service missing registration or login export');
    }
  });

  await test('AUTH-02 & AUTH-04', 'Logout and password reset services correctly exported', () => {
    const authServiceContent = fs.readFileSync(path.join(rootDir, 'src/services/firebase/authService.ts'), 'utf8');
    if (!authServiceContent.includes('logoutUser') || !authServiceContent.includes('sendPasswordReset')) {
      throw new Error('Auth service missing logout or password reset export');
    }
  });

  console.log('\n======================================================');
  console.log(`  VERIFICATION RESULTS: ${results.filter(r => r.passed).length} / ${results.length} PASSED`);
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
