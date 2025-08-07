/* global __app_id, __firebase_config, __initial_auth_token */
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Import useMemo and useCallback
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

import HomePage from './components/homepage';
import DashboardLayout from './components/DashboardLayout';
import AdminDashboardLayout from './components/AdminDashboardLayout';

import MessagePopup from './components/common/MessagePopup';
import { COLORS, MEMBERSHIP_PLANS, getMembershipPlanByScore } from './constants';

const App = () => {
    const [app, setApp] = useState(null);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [currentView, setCurrentView] = useState('home'); // 'home', 'dashboard', 'adminDashboard'
    const [message, setMessage] = useState({ text: '', type: '' });

    // Global variables from Canvas environment
    // Use useMemo to ensure these are stable across renders, satisfying useEffect deps
    const appId = useMemo(() => typeof __app_id !== 'undefined' ? __app_id : 'default-app-id', []);
    const firebaseConfig = useMemo(() => typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {}, []);
    const initialAuthToken = useMemo(() => typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null, []);

    // Wrap showMessage in useCallback to make it stable
    const showMessage = useCallback((text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }, []); // Empty dependency array means this function is created once

    useEffect(() => {
        // Initialize Firebase
        // Only initialize if firebaseConfig is valid and app hasn't been initialized yet
        if (Object.keys(firebaseConfig).length > 0 && !app) {
            const firebaseApp = initializeApp(firebaseConfig);
            setApp(firebaseApp);
            setDb(getFirestore(firebaseApp));
            setAuth(getAuth(firebaseApp));
        }
    }, [app, firebaseConfig]); // firebaseConfig is now a stable reference due to useMemo


    useEffect(() => {
        if (auth && db) { // Ensure auth and db are initialized
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    // User is signed in, fetch profile
                    const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists()) {
                        const profileData = { id: user.uid, ...docSnap.data() };
                        setUserProfile(profileData);
                        // Determine initial view based on role
                        if (profileData.specialRole === 'Admin' || profileData.specialRole === 'Super Admin') {
                            setCurrentView('adminDashboard');
                        } else {
                            setCurrentView('dashboard');
                        }
                    } else {
                        // Profile not found, sign out or handle error
                        console.error("User profile not found in Firestore for UID:", user.uid);
                        showMessage("User profile data missing. Please contact support.", "error");
                        auth.signOut(); // Force sign out if profile is missing
                        setCurrentView('home');
                    }
                } else {
                    // User is signed out
                    setUserProfile(null);
                    setCurrentView('home');
                }
            });

            // Attempt to sign in with custom token if available
            const signInWithToken = async () => {
                if (initialAuthToken) {
                    try {
                        await signInWithCustomToken(auth, initialAuthToken);
                        console.log("Signed in with custom token.");
                    } catch (error) {
                        console.error("Error signing in with custom token:", error);
                        // Fallback to anonymous sign-in if custom token fails
                        try {
                            await signInAnonymously(auth);
                            console.log("Signed in anonymously as fallback.");
                        } catch (anonError) {
                            console.error("Error signing in anonymously:", anonError);
                            showMessage("Failed to authenticate. Please try again.", "error");
                        }
                    }
                } else {
                    // If no custom token, sign in anonymously for initial access
                    try {
                        await signInAnonymously(auth);
                        console.log("Signed in anonymously (no initial token).");
                    } catch (anonError) {
                        console.error("Error signing in anonymously:", anonError);
                        showMessage("Failed to authenticate. Please try again.", "error");
                    }
                }
            };

            signInWithToken(); // Call the sign-in function

            return () => unsubscribe(); // Cleanup auth listener
        }
    }, [auth, db, appId, initialAuthToken, showMessage, setCurrentView]); // showMessage is now stable


    // Helper functions for registration
    const generateBankId = () => {
        return 'BANK' + Math.floor(10000 + Math.random() * 90000).toString();
    };

    const generateKycCode = () => {
        return 'KYC' + Math.floor(10000 + Math.random() * 90000).toString();
    };

    const generateRandomCardDetails = () => {
        const generateSegment = () => Math.floor(1000 + Math.random() * 9000).toString();
        const cardNumber = `4242 ${generateSegment()} ${generateSegment()} ${generateSegment()}`;
        const currentYear = new Date().getFullYear();
        const expiryYear = currentYear + 4; // Card valid for 4 years
        const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0'); // Random month 01-12
        const expiryDate = new Date(expiryYear, parseInt(expiryMonth) - 1, 1); // For internal tracking
        const expiry = `${expiryMonth}/${String(expiryYear).slice(-2)}`;
        const cvv = Math.floor(100 + Math.random() * 900).toString();
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        return { number: cardNumber, expiry, expiryDate: expiryDate.toISOString(), cvv, pin, type: 'Debit' };
    };

    // handleLogin function for HomePage
    const handleLogin = async (discordId, password) => {
        if (!db || !auth) {
            showMessage("Application not fully initialized. Please wait.", "error");
            return;
        }
        try {
            const usersRef = collection(db, `artifacts/${appId}/users`);
            const q = query(usersRef, where("discordId", "==", discordId), where("password", "==", password));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                const customToken = userData.customAuthToken; // Assuming you store a custom token for re-authentication
                if (customToken) {
                    await signInWithCustomToken(auth, customToken);
                } else {
                    // Fallback to anonymous sign-in if no custom token (for initial setup)
                    await signInAnonymously(auth);
                }
                setUserProfile({ id: querySnapshot.docs[0].id, ...userData });
                showMessage('Login successful!', 'success');
                setCurrentView(userData.specialRole === 'Admin' || userData.specialRole === 'Super Admin' ? 'adminDashboard' : 'dashboard');
            } else {
                showMessage('Invalid Discord ID or password.', 'error');
            }
        } catch (error) {
            console.error("Login error:", error);
            showMessage(`Login failed: ${error.message}`, 'error');
        }
    };

    // handleRegister function for HomePage
    const handleRegister = async ({ rpName, discordId, password, confirmPassword, occupation, region }) => {
        if (!db || !auth) {
            showMessage("Application not fully initialized. Please wait.", "error");
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Passwords do not match.', 'error');
            return;
        }

        try {
            // Check if Discord ID already exists
            const discordIdQuery = query(collection(db, `artifacts/${appId}/users`), where("discordId", "==", discordId));
            const discordIdSnap = await getDocs(discordIdQuery);

            if (!discordIdSnap.empty) {
                showMessage('Discord ID already registered.', 'error');
                return;
            }

            const bankId = generateBankId();
            const kycCodeGenerated = generateKycCode();
            const initialCreditScore = 500; // Starting credit score
            const initialUserTier = getMembershipPlanByScore(initialCreditScore).name;

            const debitCardDetails = generateRandomCardDetails();

            const newUser = {
                name: rpName, // RP Name
                discordId,
                password, // In a real app, hash this!
                occupation,
                region,
                bankId,
                kycCode: kycCodeGenerated,
                balance: 0.00,
                accounts: {
                    Personal: { balance: 0.00, accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString() } // Initial Personal/Checking account
                },
                transactions: [],
                loanHistory: [],
                creditScore: initialCreditScore,
                isFrozen: false,
                specialRole: 'User', // Default role
                isBusinessOwner: false,
                businessRegistrationId: null,
                isLoanBlacklisted: false,
                isCreditFrozen: false,
                isCreditCardSuspended: false,
                newLoanBlockedEndDate: null,
                isSuspicious: false,
                triggerInternalAffairs: false,
                isVIP: false,
                isAdmin: false,
                userTier: initialUserTier,
                debitCard: debitCardDetails, // Assign generated debit card
                hasCreditCard: false, // User starts without a credit card
                creditCardInterestRate: 0.0, // Default to 0, updated on credit card approval
                lastCreditCardPaymentDate: null,
                missedCreditCardPayments: 0,
                lastCreditCardInterestAppliedDate: null,
                overCreditPenaltyApplied: false,
                customAuthToken: null, // This would be generated server-side in a real app
            };

            const userDocRef = doc(collection(db, `artifacts/${appId}/users`));
            await setDoc(userDocRef, newUser);

            // Sign in the newly registered user
            await signInAnonymously(auth); // Or use custom token if generated server-side
            setUserProfile({ id: userDocRef.id, ...newUser });
            showMessage('Registration successful! Welcome to Sberbank.', 'success');
            setCurrentView('dashboard');

        } catch (error) {
            console.error("Registration error:", error);
            showMessage(`Registration failed: ${error.message}`, 'error');
        }
    };


    // Render content based on currentView
    let content;
    if (!db || !auth) {
        content = (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background, color: COLORS.typography }}>
                <p className="text-xl">Initializing application...</p>
            </div>
        );
    } else {
        switch (currentView) {
            case 'home':
                content = (
                    <HomePage
                        handleLogin={handleLogin}
                        handleRegister={handleRegister}
                        setCurrentView={setCurrentView}
                        setUserProfile={setUserProfile}
                        db={db}
                        appId={appId}
                        auth={auth}
                        showMessage={showMessage}
                    />
                );
                break;
            case 'dashboard':
                content = userProfile ? (
                    <DashboardLayout
                        userProfile={userProfile}
                        setUserProfile={setUserProfile}
                        setCurrentView={setCurrentView}
                        db={db}
                        appId={appId}
                        auth={auth}
                        showMessage={showMessage}
                    />
                ) : (
                    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background, color: COLORS.typography }}>
                        <p className="text-xl">Redirecting to login...</p>
                    </div>
                );
                break;
            case 'adminDashboard':
                content = userProfile ? (
                    <AdminDashboardLayout
                        userProfile={userProfile}
                        setUserProfile={setUserProfile}
                        setCurrentView={setCurrentView}
                        db={db}
                        appId={appId}
                        auth={auth}
                        showMessage={showMessage}
                    />
                ) : (
                    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background, color: COLORS.typography }}>
                        <p className="text-xl">Redirecting to login...</p>
                    </div>
                );
                break;
            default:
                content = (
                    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background, color: COLORS.typography }}>
                        <p className="text-xl">Page not found.</p>
                    </div>
                );
        }
    }

    return (
        <>
            {content}
            {message.text && <MessagePopup message={message.text} type={message.type} />}
        </>
    );
};

export default App;
