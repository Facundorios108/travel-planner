import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Verify that the environment variables are present
const isFirebaseConfigured = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;

if (!getApps().length) {
    if (isFirebaseConfigured) {
        try {
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
            console.log('Firebase Admin initialized successfully.');
        } catch (error) {
            console.error('Firebase Admin initialization error', error);
        }
    } else {
        console.warn('Firebase Admin is not configured. Missing environment variables.');
    }
}

const adminDb = getApps().length ? getFirestore() : null;

export { adminDb };
