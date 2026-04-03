import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  let serviceAccount: admin.ServiceAccount | undefined;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      // Support both raw JSON and base64-encoded JSON (for Vercel env vars)
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      const decoded = raw.startsWith('{')
        ? raw
        : Buffer.from(raw, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decoded);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    }
  }

  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminAuth = admin.auth();
export default admin;
