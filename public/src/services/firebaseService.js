// firebaseService.js - Production Firebase setup
import {initializeApp} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {getAnalytics} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';


// REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyACB5lnRzzgIKR1toEXVKGkBfadk6KB_g0",
    authDomain: "guitar-practice-journal-9f064.firebaseapp.com",
    projectId: "guitar-practice-journal-9f064",
    storageBucket: "guitar-practice-journal-9f064.firebasestorage.app",
    messagingSenderId: "657026172181",
    appId: "1:657026172181:web:3a41e0793d0763e229d51c",
    measurementId: "G-XRW7J1FY1M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

class CloudStorage {
    constructor() {
        this.currentUser = null;
        this.isReady = false;
        this.init();
    }

    init() {
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.isReady = true;
            console.log(user ? '✅ User authenticated' : '❌ User not authenticated');
            // Dispatch event to update UI
            window.dispatchEvent(new CustomEvent('authStateChanged', {detail: {user}}));
            // Auto-update UI when auth state changes
            setTimeout(() => {
                if (window.app?.currentPage?.cloudSyncHandler) {
                    window.app.currentPage.cloudSyncHandler.updateCloudStatus();
                }
            }, 500);
        });
    }

    async ensureInitialized() {
        while (!this.isReady) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async signIn(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return {success: true, user: result.user};
        } catch (error) {
            return {success: false, error: error.message};
        }
    }

    async signUp(email, password) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return {success: true, user: result.user};
        } catch (error) {
            return {success: false, error: error.message};
        }
    }

    async signOut() {
        await signOut(auth);
    }

    async saveData(key, data) {
        if (!this.currentUser) throw new Error('Not authenticated');

        const docRef = doc(db, 'users', this.currentUser.uid, 'data', key);
        await setDoc(docRef, {data, timestamp: new Date()});
    }

    async loadData(key) {
        if (!this.currentUser) return null;

        const docRef = doc(db, 'users', this.currentUser.uid, 'data', key);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data().data : null;
    }

    async savePracticeSession(entry) {
        if (!this.currentUser) throw new Error('Not authenticated');

        const sessionId = entry.id || `session_${Date.now()}`;
        const docRef = doc(db, 'users', this.currentUser.uid, 'sessions', sessionId);
        await setDoc(docRef, {...entry, id: sessionId, timestamp: new Date()});
    }
}

export const cloudStorage = new CloudStorage();
export {auth, db};