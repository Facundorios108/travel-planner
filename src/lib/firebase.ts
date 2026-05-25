import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if we have at least the API Key and Project ID before initializing
const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

const dummyConfig = {
    apiKey: "dummy-key-for-build",
    authDomain: "dummy-auth-domain-for-build",
    projectId: "dummy-project-id-for-build",
    storageBucket: "dummy-storage-bucket-for-build",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:1234567890abcdef"
};

// Initialize Firebase only once
const app: FirebaseApp = getApps().length === 0 
    ? initializeApp(isFirebaseConfigured ? firebaseConfig : dummyConfig) 
    : getApps()[0];

const auth: Auth = getAuth(app);
const db: Firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// Analytics is only available in browser environments
let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, db, analytics };
