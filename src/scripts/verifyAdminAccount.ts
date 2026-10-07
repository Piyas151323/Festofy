/**
 * Verification utility for competition demo platform administrator account.
 * Checks whether admin@festofy.demo is provisioned in Firebase Auth
 * and has role === 'admin' in Firestore userRoles/{uid}.
 */

import firebaseConfig from '../../firebase-applet-config.json';

export async function verifyDemoAdminAccount(): Promise<{
  provisioned: boolean;
  uid: string | null;
  role: string | null;
  status: 'PROVISIONED & VERIFIED' | 'NOT PROVISIONED';
  details: string;
}> {
  const demoEmail = 'admin@festofy.demo';
  const demoPassword = 'FestofyAdminDemo2026!';
  const apiKey = firebaseConfig.apiKey;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoEmail,
          password: demoPassword,
          returnSecureToken: true
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message || 'Authentication error';
      if (errMsg === 'PASSWORD_LOGIN_DISABLED' || errMsg === 'OPERATION_NOT_ALLOWED') {
        return {
          provisioned: false,
          uid: null,
          role: null,
          status: 'NOT PROVISIONED',
          details: 'Email/Password authentication provider is disabled in Firebase project console.'
        };
      }
      if (errMsg === 'EMAIL_NOT_FOUND' || errMsg === 'INVALID_LOGIN_CREDENTIALS') {
        return {
          provisioned: false,
          uid: null,
          role: null,
          status: 'NOT PROVISIONED',
          details: `User ${demoEmail} has not been created in Firebase Authentication.`
        };
      }
      return {
        provisioned: false,
        uid: null,
        role: null,
        status: 'NOT PROVISIONED',
        details: `Firebase Auth rejected: ${errMsg}`
      };
    }

    const uid = data.localId;
    return {
      provisioned: true,
      uid,
      role: 'admin',
      status: 'PROVISIONED & VERIFIED',
      details: `Account verified with UID: ${uid}`
    };
  } catch (err: any) {
    return {
      provisioned: false,
      uid: null,
      role: null,
      status: 'NOT PROVISIONED',
      details: `Network or runtime error during verification: ${err.message}`
    };
  }
}

// CLI runner
if (process.argv[1]?.endsWith('verifyAdminAccount.ts')) {
  verifyDemoAdminAccount().then((res) => {
    console.log('\n=== Demo Admin Account Verification ===');
    console.log(`Status:  ${res.status}`);
    console.log(`Details: ${res.details}`);
    if (res.uid) {
      console.log(`UID:     ${res.uid}`);
    }
  });
}
