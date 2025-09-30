// Copied from root firebase-config.js for safe public serving
// Firebase Configuration for TravelBunk Frontend
// Replace with your actual Firebase config from Firebase Console

const firebaseConfig = {
    // TODO: Replace with your actual Firebase config from Firebase Console
    // Get this from: Firebase Console → Project Settings → General → Your apps → Web app
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase (this will be loaded via CDN in HTML)
let auth, db;

// Initialize Firebase when the script loads
document.addEventListener('DOMContentLoaded', function() {
    const hasRealConfig = firebaseConfig &&
        firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your-api-key-here' &&
        firebaseConfig.projectId && firebaseConfig.projectId !== 'your-project-id' &&
        firebaseConfig.appId && firebaseConfig.appId !== 'your-app-id';

    if (!hasRealConfig) {
        console.warn('⚠️ Firebase web config is not set. Auth features are disabled until you add real keys in public/firebase-config.js');
        // Provide safe no-op auth API to avoid runtime crashes
        window.firebaseAuth = {
            signUp: async () => ({ success: false, error: 'Firebase not configured' }),
            signIn: async () => ({ success: false, error: 'Firebase not configured' }),
            signInWithGoogle: async () => ({ success: false, error: 'Firebase not configured' }),
            signOut: async () => ({ success: true }),
            getCurrentUser: () => null,
            isAuthenticated: () => false
        };
        return; // Skip SDK init
    }

    if (typeof firebase !== 'undefined') {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();

        console.log('✅ Firebase initialized successfully');

        // Auth state observer
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User is signed in:', user.email);
                handleAuthenticatedUser(user);
            } else {
                console.log('User is signed out');
                handleUnauthenticatedUser();
            }
        });
    } else {
        console.error('❌ Firebase SDK not loaded. Please check your internet connection and Firebase CDN links.');
    }
});

// Handle authenticated user
async function handleAuthenticatedUser(user) {
    try {
        // Get Firebase ID token
        const idToken = await user.getIdToken();
        
        // Send to backend for verification and user creation/update
        const response = await fetch('/api/auth/firebase-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firebaseToken: idToken,
                userData: {
                    name: user.displayName,
                    profilePicture: user.photoURL,
                    travelPreferences: {}
                }
            })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            // Attach JWT to API requests if helper exists
            if (typeof window.attachJWTToRequests === 'function') {
                window.attachJWTToRequests(data.token);
            } else if (window.axios && window.axios.defaults && window.axios.defaults.headers) {
                window.axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            }
            
            // Redirect to main page if on auth pages
            if (window.location.pathname.includes('signin') || window.location.pathname.includes('signup')) {
                window.location.href = '/';
            }
        } else {
            console.error('Backend authentication failed');
        }
    } catch (error) {
        console.error('Authentication error:', error);
    }
}

// Handle unauthenticated user
function handleUnauthenticatedUser() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Remove Authorization header from axios if present
    if (window.axios && window.axios.defaults && window.axios.defaults.headers && window.axios.defaults.headers.common) {
        delete window.axios.defaults.headers.common['Authorization'];
    }
    
    // Redirect to signin if on protected pages
    const protectedPages = ['/', '/dashboard', '/profile'];
    if (protectedPages.includes(window.location.pathname)) {
        // Don't redirect immediately, let user see the page
        // window.location.href = '/signin.html';
    }
}

// Firebase Authentication Functions
window.firebaseAuth = {
    // Sign up with email and password
    signUp: async (email, password, displayName) => {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update profile with display name
            await userCredential.user.updateProfile({
                displayName: displayName
            });
            
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign in with email and password
    signIn: async (email, password) => {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign in with Google
    signInWithGoogle: async () => {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Google sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign out
    signOut: async () => {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get current user
    getCurrentUser: () => {
        return auth.currentUser;
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!auth.currentUser;
    }
};
