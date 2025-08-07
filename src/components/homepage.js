import React, { useState } from 'react';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import GlassCard from './common/GlassCard';
import MessagePopup from './common/MessagePopup';
import { COLORS, MEMBERSHIP_PLANS, getMembershipPlanByScore, REGION_CODES } from '../constants';

const HomePage = ({ setCurrentView, setUserProfile, db, appId, auth }) => {
    const [isLogin, setIsLogin] = useState(true); // Controls whether it's login or register form
    const [email, setEmail] = useState(''); // Email for login/registration
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // For registration
    const [rpName, setRpName] = useState(''); // For registration
    const [discordId, setDiscordId] = useState(''); // For registration/login (as a unique identifier)
    const [occupation, setOccupation] = useState(''); // For registration
    const [region, setRegion] = useState(''); // For registration
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

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

    const handleAuth = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                // Login logic: Use discordId and password for login
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
            } else {
                // Register logic
                if (password !== confirmPassword) {
                    showMessage('Passwords do not match.', 'error');
                    return;
                }

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

            }
        } catch (error) {
            console.error("Authentication error:", error);
            showMessage(`Authentication failed: ${error.message}`, 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.background }}>
            <GlassCard className="p-8 w-full max-w-md">
                <h2 className="text-4xl font-bold text-center mb-8" style={{ color: COLORS.primaryAccent }}>
                    {isLogin ? 'Login' : 'Register'}
                </h2>

                <form onSubmit={handleAuth} className="space-y-6">
                    {/* Registration Fields (conditionally rendered) */}
                    {!isLogin && (
                        <>
                            <div>
                                <label htmlFor="rpName" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>RP Name</label>
                                <input
                                    type="text"
                                    id="rpName"
                                    value={rpName}
                                    onChange={(e) => setRpName(e.target.value)}
                                    placeholder="Your Roleplay Name"
                                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                    style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                    required={!isLogin}
                                />
                            </div>
                            <div>
                                <label htmlFor="occupation" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Occupation</label>
                                <input
                                    type="text"
                                    id="occupation"
                                    value={occupation}
                                    onChange={(e) => setOccupation(e.target.value)}
                                    placeholder="e.g., Engineer, Doctor"
                                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                    style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                    required={!isLogin}
                                />
                            </div>
                            <div>
                                <label htmlFor="region" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Region</label>
                                <select
                                    id="region"
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                    style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                    required={!isLogin}
                                >
                                    <option value="">Select your region</option>
                                    {REGION_CODES.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Common Fields for both Login and Registration */}
                    <div>
                        <label htmlFor="discordId" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Discord ID</label>
                        <input
                            type="text"
                            id="discordId"
                            value={discordId}
                            onChange={(e) => setDiscordId(e.target.value)}
                            placeholder="yourdiscord#1234"
                            className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                            style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                                className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200 pr-10"
                                style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.54 18.54 0 0 1 2.21-3.6l-1.5-1.5M1.49 1.49 22.51 22.51"/><path d="M9.9 4.24A9.9 9.9 0 0 1 12 4c7 0 11 8 11 8a18.54 18.54 0 0 1-2.21 3.6l-2.81-2.81"/><path d="M14.9 14.9a3 3 0 0 1-4.24-4.24"/></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password (only for Registration) */}
                    {!isLogin && (
                        <div>
                            <label htmlFor="confirmPassword" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="********"
                                className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                        style={{ backgroundColor: COLORS.primaryAccent, color: COLORS.background, boxShadow: `0 0 15px ${COLORS.buttonsGlow}` }}
                    >
                        {isLogin ? 'Login' : 'Register Account'}
                    </button>
                </form>

                {/* Toggle between Login and Register */}
                <p className="text-center mt-6 text-gray-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            // Clear form fields when toggling
                            setEmail('');
                            setPassword('');
                            setConfirmPassword('');
                            setRpName('');
                            setDiscordId('');
                            setOccupation('');
                            setRegion('');
                            setMessage({ text: '', type: '' }); // Clear any messages
                        }}
                        className="font-semibold"
                        style={{ color: COLORS.primaryAccent }}
                    >
                        {isLogin ? 'Register' : 'Login'}
                    </button>
                </p>
                {message.text && <MessagePopup message={message.text} type={message.type} />}
            </GlassCard>
        </div>
    );
};

export default HomePage;
