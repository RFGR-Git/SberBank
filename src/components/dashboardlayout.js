import React, { useEffect, useState, useCallback } from 'react';
import { doc, updateDoc, collection, addDoc, getDoc, deleteDoc, runTransaction, query, where, getDocs } from 'firebase/firestore';
import GlassCard from './common/GlassCard';
import { COLORS, PENALTY_RULES, MEMBERSHIP_PLANS, getMembershipPlanByScore, getMembershipPlanByName } from '../constants';
import { UserCog, Briefcase, Landmark, TrendingUp, PiggyBank, CreditCard, PlusCircle, FileText, Shield, DollarSign, Wallet, Banknote, ArrowLeftRight, Home, LogOut, Info, ReceiptText, Lock, LayoutDashboard, WalletCards, History, Scale, TrendingUpIcon, Settings } from 'lucide-react'; // Added Settings icon

const DashboardLayout = ({ userProfile, setUserProfile, setCurrentView, db, appId, auth, showMessage }) => {
    const [activeTab, setActiveTab] = useState('home'); // 'home', 'accounts', 'transactions', 'loans', 'credit'
    const [showOpenAccountModal, setShowOpenAccountModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [transactionServiceTab, setTransactionServiceTab] = useState('deposit');

    const [newAccountType, setNewAccountType] = useState('');
    const [newAccountInitialDeposit, setNewAccountInitialDeposit] = useState('');
    const [newAccountBusinessRegId, setNewAccountBusinessRegId] = useState('');
    const [newAccountMinistryName, setNewAccountMinistryName] = useState('');
    const [newAccountProofOfFunds, setNewAccountProofOfFunds] = useState('');

    const [depositAmount, setDepositAmount] = useState('');
    const [depositAccount, setDepositAccount] = useState('');
    const [depositDiscordLink, setDepositDiscordLink] = useState('');

    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [withdrawalAccount, setWithdrawalAccount] = useState('');

    const [transferAmount, setTransferAmount] = useState('');
    const [transferFromAccount, setTransferFromAccount] = useState('');
    const [transferRecipientUserId, setTransferRecipientUserId] = useState('');
    const [transferRecipientAccountNumber, setTransferRecipientAccountNumber] = useState('');

    const [loanType, setLoanType] = useState('');
    const [loanAmount, setLoanAmount] = useState('');
    const [loanPeriod, setLoanPeriod] = useState('');
    const [loanCollateralLink, setLoanCollateralLink] = useState('');
    const [loanDownPayment, setLoanDownPayment] = useState('');
    const [loanPropertyRegion, setLoanPropertyRegion] = useState('');

    const [creditCardSpendAmount, setCreditCardSpendAmount] = useState('');
    const [creditCardPaybackAmount, setCreditCardPaybackAmount] = useState('');
    const [creditCardPaybackSourceAccount, setCreditCardPaybackSourceAccount] = useState('');

    const [showProfileDetails, setShowProfileDetails] = useState(false);
    const [showLoanPaymentModal, setShowLoanPaymentModal] = useState(false);
    const [selectedLoanToPay, setSelectedLoanToPay] = useState(null); // To store the loan being paid
    const [loanPaymentAmount, setLoanPaymentAmount] = useState('');
    const [loanPaymentSourceAccount, setLoanPaymentSourceAccount] = useState('');

    const [showCreditPaymentModal, setShowCreditPaymentModal] = useState(false); // New state for credit payment modal
    const [creditPaymentAmount, setCreditPaymentAmount] = useState('');
    const [creditPaymentSourceAccount, setCreditPaymentSourceAccount] = useState('');

    const [showAccountCardModal, setShowAccountCardModal] = useState(false); // New state for account card modal
    const [selectedAccountCardDetails, setSelectedAccountCardDetails] = useState(null); // Details for the card to display


    // Get current membership plan details based on user's assigned tier name
    const currentUserMembershipPlan = getMembershipPlanByName(userProfile.userTier || 'Restricted');

    // Helper to get initials
    const getUserInitials = (name) => {
        if (!name) return '';
        const parts = name.split(' ').filter(Boolean);
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
        return '';
    };

    // Helper to generate a unique 10-digit account number
    const generateAccountNumber = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();


    const fetchUserProfile = useCallback(async () => {
        if (auth.currentUser) {
            const userDocRef = doc(db, `artifacts/${appId}/users`, auth.currentUser.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const updatedProfile = docSnap.data();
                setUserProfile(updatedProfile);
                await applyAutomatedPenalties(updatedProfile);
                await checkAndApplyTierUpgrades(updatedProfile);
            } else {
                showMessage("User profile not found. Please re-login.", "error");
                setCurrentView('home');
            }
        }
    }, [auth, db, appId, setUserProfile, setCurrentView, showMessage]);

    const updateUserProfileInFirestore = useCallback(async (updates) => {
        if (!auth.currentUser) return;
        const userDocRef = doc(db, `artifacts/${appId}/users`, auth.currentUser.uid);
        try {
            await updateDoc(userDocRef, updates);
            await fetchUserProfile();
        } catch (error) {
            console.error("Failed to update user profile in Firestore:", error);
            showMessage(`Failed to update profile: ${error.message}`, "error");
        }
    }, [auth, db, appId, fetchUserProfile, showMessage]);


    const applyAutomatedPenalties = useCallback(async (profile) => {
        let updatedProfile = { ...profile };
        let changesMade = false;
        const now = new Date();

        const currentProfilePlanInfo = getMembershipPlanByName(updatedProfile.userTier || 'Restricted');

        // 1. Overused Credit (Exceeded Credit Limit)
        if (updatedProfile.hasCreditCard && (updatedProfile.accounts?.CreditCard?.balance ?? 0) > (updatedProfile.accounts?.CreditCardLimit ?? 0)) {
            const overage = (updatedProfile.accounts.CreditCard.balance ?? 0) - (updatedProfile.accounts.CreditCardLimit ?? 0);
            if (overage > 0 && !(updatedProfile.overCreditPenaltyApplied)) {
                const interestSpike = PENALTY_RULES.OVERUSED_CREDIT.interestSpike;
                const currentInterestRate = updatedProfile.creditCardInterestRate ?? 0;
                const newInterestRate = currentInterestRate + interestSpike;
                updatedProfile.creditCardInterestRate = newInterestRate;

                const creditScoreDecrease = Math.floor(Math.random() * (PENALTY_RULES.OVERUSED_CREDIT.creditScoreDecrease[1] - PENALTY_RULES.OVERUSED_CREDIT.creditScoreDecrease[0] + 1)) + PENALTY_RULES.OVERUSED_CREDIT.creditScoreDecrease[0];
                updatedProfile.creditScore = Math.max(0, (updatedProfile.creditScore ?? 0) - creditScoreDecrease);
                updatedProfile.overCreditPenaltyApplied = true;

                showMessage(`Warning: Credit limit exceeded by ₽${overage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}! Interest rate increased to ${(newInterestRate * 100).toFixed(2)}%, credit score decreased by ${creditScoreDecrease} points.`, 'warning');
                changesMade = true;
            }
        } else if (updatedProfile.overCreditPenaltyApplied && (updatedProfile.accounts?.CreditCard?.balance ?? 0) <= (updatedProfile.accounts?.CreditCardLimit ?? 0)) {
            updatedProfile.overCreditPenaltyApplied = false;
            changesMade = true;
        }

        // 2. Missed Payment (Credit Card)
        if (updatedProfile.hasCreditCard && (updatedProfile.accounts?.CreditCard?.balance ?? 0) > 0 && updatedProfile.lastCreditCardPaymentDate) {
            const lastPaymentDate = new Date(updatedProfile.lastCreditCardPaymentDate);
            const hoursSinceLastPayment = (now.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60);

            const lastInterestApplyTime = updatedProfile.lastCreditCardInterestAppliedDate ? new Date(updatedProfile.lastCreditCardInterestAppliedDate) : lastPaymentDate;
            const hoursSinceLastInterest = (now.getTime() - lastInterestApplyTime.getTime()) / (1000 * 60 * 60);

            if (hoursSinceLastPayment >= 12 && hoursSinceLastInterest >= 12) {
                const outstandingBalance = updatedProfile.accounts.CreditCard.balance ?? 0;
                const lateFee = outstandingBalance * (currentProfilePlanInfo.lateFeeRate ?? 0);
                updatedProfile.accounts.CreditCard.balance = (updatedProfile.accounts.CreditCard.balance ?? 0) + lateFee;

                const creditScoreDing = PENALTY_RULES.MISSED_PAYMENT.creditScoreDing[currentProfilePlanInfo.name] || 10;
                updatedProfile.creditScore = Math.max(0, (updatedProfile.creditScore ?? 0) - creditScoreDing);
                updatedProfile.missedCreditCardPayments = (updatedProfile.missedCreditCardPayments ?? 0) + 1;
                updatedProfile.lastCreditCardInterestAppliedDate = now.toISOString();

                showMessage(`Late Payment: A late fee of ₽${lateFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} applied to your credit card. Credit score decreased by ${creditScoreDing} points.`, 'error');
                changesMade = true;
            }
        }

        // 3. Missed Payment (Loan)
        if (updatedProfile.loanHistory && updatedProfile.loanHistory.length > 0) {
            updatedProfile.loanHistory = updatedProfile.loanHistory.map(loan => {
                if (loan.status === 'Active' && loan.lastPaymentDate) {
                    const lastLoanPaymentDate = new Date(loan.lastPaymentDate);
                    const hoursSinceLastLoanPayment = (now.getTime() - lastLoanPaymentDate.getTime()) / (1000 * 60 * 60);

                    if (hoursSinceLastLoanPayment >= 12 && (loan.missedPayments ?? 0) === 0) {
                        const monthlyPayment = (loan.amount / loan.repaymentPeriod) * (1 + loan.interestRate);
                        const lateFee = monthlyPayment * (currentProfilePlanInfo.lateFeeRate ?? 0);
                        loan.totalInterestAccrued = (loan.totalInterestAccrued ?? 0) + lateFee;

                        const creditScoreDing = PENALTY_RULES.MISSED_PAYMENT.creditScoreDing[currentProfilePlanInfo.name] || 10;
                        updatedProfile.creditScore = Math.max(0, (updatedProfile.creditScore ?? 0) - creditScoreDing);
                        loan.missedPayments = (loan.missedPayments ?? 0) + 1;

                        showMessage(`Late Loan Payment: A late fee of ₽${lateFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} applied to your loan. Credit score decreased by ${creditScoreDing} points.`, 'error');
                        changesMade = true;
                    }
                }
                return loan;
            });
        }

        // 4. Loan Default
        if (updatedProfile.loanHistory && updatedProfile.loanHistory.some(loan => (loan.missedPayments ?? 0) >= 3 && loan.status === 'Active')) {
            updatedProfile.loanHistory = updatedProfile.loanHistory.map(loan => {
                if ((loan.missedPayments ?? 0) >= 3 && loan.status === 'Active') {
                    loan.status = 'Defaulted';
                    const interestIncrease = PENALTY_RULES.LOAN_DEFAULT.interestIncrease;
                    loan.interestRate = (loan.interestRate ?? 0) + interestIncrease;
                    const creditScorePenalty = Math.floor(Math.random() * (PENALTY_RULES.LOAN_DEFAULT.creditScorePenalty[1] - PENALTY_RULES.LOAN_DEFAULT.creditScorePenalty[0] + 1)) + PENALTY_RULES.LOAN_DEFAULT.creditScorePenalty[0];
                    updatedProfile.creditScore = Math.max(0, (updatedProfile.creditScore ?? 0) - creditScorePenalty);
                    updatedProfile.isLoanBlacklisted = true;
                    updatedProfile.triggerInternalAffairs = true;

                    showMessage(`Loan Defaulted: Your loan has defaulted! Interest rate increased, credit score significantly decreased, and new loan services are locked.`, 'error');
                    changesMade = true;
                }
                return loan;
            });
        }

        if (changesMade) {
            await updateUserProfileInFirestore(updatedProfile);
        }
    }, [updateUserProfileInFirestore, showMessage]);


    const checkAndApplyTierUpgrades = useCallback(async (profile) => {
        let updatedProfile = { ...profile };
        let changesMade = false;
        let currentScore = profile.creditScore ?? 0;
        let currentPlanName = profile.userTier || 'Restricted';

        const currentProfilePlanInfo = getMembershipPlanByName(currentPlanName);
        const targetPlanByScore = getMembershipPlanByScore(currentScore);

        const currentPlanIndex = MEMBERSHIP_PLANS.findIndex(plan => plan.name === currentProfilePlanInfo.name);
        const targetPlanIndex = MEMBERSHIP_PLANS.findIndex(plan => plan.name === targetPlanByScore.name);

        if (targetPlanIndex > currentPlanIndex) {
            const nextPlan = MEMBERSHIP_PLANS[targetPlanIndex];

            updatedProfile.userTier = nextPlan.name;
            if (nextPlan.name === 'Shadow (VIP)') {
                updatedProfile.isVIP = true;
            }
            showMessage(`Congratulations! You have been upgraded to ${nextPlan.name} Membership Plan!`, 'success');
            changesMade = true;
        }

        if (changesMade) {
            await updateUserProfileInFirestore(updatedProfile);
        }
    }, [updateUserProfileInFirestore, showMessage]);


    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);


    const handleOpenAccount = async (e) => {
        e.preventDefault();

        if (!newAccountType || (newAccountInitialDeposit === '' || isNaN(newAccountInitialDeposit) || parseFloat(newAccountInitialDeposit) < 0)) {
            showMessage("Please select an account type and enter a valid initial deposit.", "warning");
            return;
        }

        const initialDeposit = parseFloat(newAccountInitialDeposit);

        // Rename "Personal" to "Checking" for internal logic consistency
        const actualAccountType = newAccountType === 'Personal' ? 'Checking' : newAccountType;

        if (userProfile.accounts?.[actualAccountType]?.accountNumber !== undefined) {
            showMessage(`You already have a ${actualAccountType} account.`, "warning");
            return;
        }

        const accountRequest = {
            userId: userProfile.id,
            userName: userProfile.name,
            discordId: userProfile.discordId,
            accountType: actualAccountType, // Use renamed type
            initialDeposit: initialDeposit,
            proofOfFundsLink: newAccountProofOfFunds,
            timestamp: new Date().toISOString(),
            status: 'Pending',
            accountNumber: generateAccountNumber()
        };

        if (actualAccountType === 'Business') {
            if (!newAccountBusinessRegId) {
                showMessage("Business Registration ID is required for a Business account.", "warning");
                return;
            }
            accountRequest.businessRegId = newAccountBusinessRegId;
        } else if (actualAccountType === 'Government') {
            if (!newAccountMinistryName) {
                showMessage("Ministry/Agency Name is required for a Government account.", "warning");
                return;
            }
            accountRequest.ministryName = newAccountMinistryName;
        }

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/accountCreationRequests`), accountRequest);
            showMessage(`Account creation request for ${actualAccountType} submitted with ₽${initialDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Awaiting admin approval.`, "success");
            setShowOpenAccountModal(false);
            setNewAccountType('');
            setNewAccountInitialDeposit('');
            setNewAccountBusinessRegId('');
            setNewAccountMinistryName('');
            setNewAccountProofOfFunds('');
        } catch (error) {
            console.error("Failed to submit account creation request:", error);
            showMessage(`Failed to submit account creation request: ${error.message}`, "error");
        }
    };


    const handleDeposit = async (e) => {
        e.preventDefault();
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0 || !depositAccount || !depositDiscordLink) {
            showMessage("Please enter a valid amount, select an account, and provide a Discord link.", "warning");
            return;
        }

        const feeRate = 0.015 * (1 - (currentUserMembershipPlan.feeDiscount ?? 0));
        const fee = amount * feeRate;
        const netDeposit = amount - fee;

        const depositRequest = {
            userId: userProfile.id,
            userName: userProfile.name,
            discordId: userProfile.discordId,
            amount: amount,
            fee: fee,
            netDeposit: netDeposit,
            accountType: depositAccount,
            discordLink: depositDiscordLink,
            timestamp: new Date().toISOString(),
            status: 'Pending'
        };

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/depositRequests`), depositRequest);
            showMessage(`Deposit request for ₽${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Fee: ₽${fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) submitted. Awaiting admin approval.`, "success");
            setDepositAmount('');
            setDepositAccount('');
            setDepositDiscordLink('');
            setShowTransactionModal(false);
        } catch (error) {
            console.error("Failed to submit deposit request:", error);
            showMessage(`Failed to submit deposit request: ${error.message}`, "error");
        }
    };

    const handleWithdrawal = async (e) => {
        e.preventDefault();
        const amount = parseFloat(withdrawalAmount);
        if (isNaN(amount) || amount <= 0 || !withdrawalAccount) {
            showMessage("Please enter a valid amount and select an account.", "warning");
            return;
        }

        const currentAccountBalance = userProfile.accounts?.[withdrawalAccount]?.balance ?? 0;
        const feeRate = 0.015 * (1 - (currentUserMembershipPlan.feeDiscount ?? 0));
        const fee = amount * feeRate;
        const totalAmountDeducted = amount + fee;

        if (currentAccountBalance < totalAmountDeducted) {
            showMessage(`Insufficient funds in ${withdrawalAccount} account. You need ₽${totalAmountDeducted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} including fees.`, "error");
            return;
        }

        const withdrawalRequest = {
            userId: userProfile.id,
            userName: userProfile.name,
            discordId: userProfile.discordId,
            amount: amount,
            fee: fee,
            totalAmountDeducted: totalAmountDeducted,
            sourceAccount: withdrawalAccount,
            timestamp: new Date().toISOString(),
            status: 'Pending'
        };

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/withdrawalRequests`), withdrawalRequest);
            showMessage(`Withdrawal request submitted for ₽${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Fee: ₽${fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Awaiting admin approval.`, "success");
            setWithdrawalAmount('');
            setWithdrawalAccount('');
            setShowTransactionModal(false);
        } catch (error) {
            console.error("Failed to submit withdrawal request:", error);
            showMessage(`Failed to submit withdrawal request: ${error.message}`, "error");
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        const amount = parseFloat(transferAmount);
        if (isNaN(amount) || amount <= 0 || !transferFromAccount || !transferRecipientUserId || !transferRecipientAccountNumber) {
            showMessage("Please fill all transfer fields with valid data.", "warning");
            return;
        }

        if (transferRecipientUserId === userProfile.discordId && userProfile.accounts?.[transferFromAccount]?.accountNumber === transferRecipientAccountNumber) {
            showMessage("Cannot transfer to the same account within your own profile.", "warning");
            return;
        }

        const currentFromAccountBalance = userProfile.accounts?.[transferFromAccount]?.balance ?? 0;
        if (currentFromAccountBalance < amount) {
            showMessage(`Insufficient funds in ${transferFromAccount} account.`, "error");
            return;
        }

        const transferRequest = {
            userId: userProfile.id,
            userName: userProfile.name,
            discordId: userProfile.discordId,
            amount: amount,
            fromAccount: transferFromAccount,
            recipientUserId: transferRecipientUserId,
            recipientAccountNumber: transferRecipientAccountNumber,
            timestamp: new Date().toISOString(),
            status: 'Pending'
        };

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/transferRequests`), transferRequest);
            showMessage(`Transfer request for ₽${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} submitted. Awaiting admin approval.`, "success");
            setTransferAmount('');
            setTransferFromAccount('');
            setTransferRecipientUserId('');
            setTransferRecipientAccountNumber('');
            setShowTransactionModal(false);
        } catch (error) {
            console.error("Failed to submit transfer request:", error);
            showMessage(`Failed to submit transfer request: ${error.message}`, "error");
        }
    };

    const handleRequestLoan = async (e) => {
        e.preventDefault();
        const amount = parseFloat(loanAmount);
        const period = parseInt(loanPeriod);
        const interest = currentUserMembershipPlan.monthlyInterestRate;
        const downPayment = parseFloat(loanDownPayment);

        if (isNaN(amount) || amount <= 0 || isNaN(period) || period <= 0 || !loanType) {
            showMessage("Please fill all loan fields with valid data.", "warning");
            return;
        }

        if (userProfile.isLoanBlacklisted) {
            showMessage("Your account is blacklisted for loans. Please contact support.", "error");
            return;
        }

        const eligibleAmount = currentUserMembershipPlan.loanEligibility[loanType] ?? 0;
        if (amount > eligibleAmount) {
            showMessage(`Your current membership plan (${currentUserMembershipPlan.name}) is only eligible for ${loanType} loans up to ₽${eligibleAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`, 'error');
            return;
        }

        if (loanType === 'Mortgage' && (isNaN(downPayment) || downPayment <= 0 || !loanPropertyRegion || !loanCollateralLink)) {
            showMessage("For Mortgage loans, down payment, property region, and collateral link are required.", "warning");
            return;
        }
        if (loanType === 'Business' && !loanCollateralLink) {
            showMessage("For Business loans, collateral link is required.", "warning");
            return;
        }

        const loanRequest = {
            userId: userProfile.id,
            userName: userProfile.name,
            discordId: userProfile.discordId,
            loanType: loanType,
            amount: amount,
            repaymentPeriod: period,
            interestRate: interest,
            collateralLink: loanCollateralLink || null,
            downPayment: loanType === 'Mortgage' ? downPayment : null,
            propertyRegion: loanType === 'Mortgage' ? loanPropertyRegion : null,
            timestamp: new Date().toISOString(),
            status: 'Pending'
        };

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/loanRequests`), loanRequest);
            showMessage(`Loan request for ₽${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} submitted. Awaiting admin approval.`, "success");
            setLoanType('');
            setLoanAmount('');
            setLoanPeriod('');
            setLoanCollateralLink('');
            setLoanDownPayment('');
            setLoanPropertyRegion('');
            setShowTransactionModal(false);
        } catch (error) {
            console.error("Failed to submit loan request:", error);
            showMessage(`Failed to submit loan request: ${error.message}`, "error");
        }
    };

    const handleRequestCreditCard = async (e) => {
        e.preventDefault();

        if (userProfile.hasCreditCard) {
            showMessage("You already have a credit card.", "warning");
            return;
        }
        if (userProfile.isCreditFrozen) {
            showMessage("Your credit is frozen. You cannot request a new credit card.", "error");
            return;
        }

        const creditLimit = currentUserMembershipPlan.baseCreditLimit === Infinity ? Infinity : currentUserMembershipPlan.baseCreditLimit * (1 + (currentUserMembershipPlan.creditLimitModifier ?? 0));
        const interestRate = currentUserMembershipPlan.monthlyInterestRate;

        const creditCardRequest = {
            userId: userProfile.id,
            userName: userProfile.name,
            discordId: userProfile.discordId,
            creditScore: userProfile.creditScore,
            creditLimit: creditLimit,
            interestRate: interestRate,
            timestamp: new Date().toISOString(),
            status: 'Pending'
        };

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/creditCardRequests`), creditCardRequest);
            showMessage(`Credit card request for limit ₽${creditLimit === Infinity ? 'Unlimited' : creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} submitted. Awaiting admin approval.`, "success");
            setShowTransactionModal(false);
        } catch (error) {
            console.error("Failed to submit credit card request:", error);
            showMessage(`Failed to submit credit card request: ${error.message}`, "error");
        }
    };

    const handleCreditCardSpend = async (e) => {
        e.preventDefault();
        const amount = parseFloat(creditCardSpendAmount);

        if (isNaN(amount) || amount <= 0) {
            showMessage("Please enter a valid amount to spend.", "warning");
            return;
        }
        // Check if user has a credit card and if the debitCard type is 'Credit'
        if (!userProfile.hasCreditCard || userProfile.debitCard?.type !== 'Credit') {
            showMessage("You do not have an active credit card.", "error");
            return;
        }

        const currentCreditDebt = userProfile.accounts?.CreditCard?.balance ?? 0;
        const creditLimit = userProfile.accounts?.CreditCardLimit ?? 0;
        const availableCredit = creditLimit === Infinity ? Infinity : creditLimit - currentCreditDebt;

        if (availableCredit !== Infinity && amount > availableCredit) {
            showMessage(`Spending ₽${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} would exceed your available credit of ₽${availableCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`, 'error');
            return;
        }

        try {
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, `artifacts/${appId}/users`, userProfile.id);
                const userSnap = await transaction.get(userDocRef);
                const userData = userSnap.data();

                const newCreditDebt = (userData.accounts?.CreditCard?.balance ?? 0) + amount;
                const newTransactions = [...(userData.transactions || []), {
                    date: new Date().toLocaleDateString('en-US'),
                    description: `Credit Card Spend`,
                    amount: -amount,
                    status: 'Completed'
                }];

                transaction.update(userDocRef, {
                    'accounts.CreditCard.balance': newCreditDebt,
                    transactions: newTransactions
                });
            });
            showMessage(`Successfully spent ₽${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} on your credit card.`, 'success');
            setCreditCardSpendAmount('');
            setShowTransactionModal(false);
            await fetchUserProfile();
        } catch (error) {
            console.error("Failed to spend on credit card:", error);
            showMessage(`Failed to spend on credit card: ${error.message}`, 'error');
        }
    };

    const handleCreditCardPayback = async (e) => {
        e.preventDefault();
        const amount = parseFloat(creditPaymentAmount); // Use creditPaymentAmount from the new modal

        if (isNaN(amount) || amount <= 0) {
            showMessage("Please enter a valid amount to pay back.", "warning");
            return;
        }
        if (!userProfile.hasCreditCard || userProfile.debitCard?.type !== 'Credit') {
            showMessage("You do not have an active credit card.", "error");
            return;
        }
        if (!creditPaymentSourceAccount) { // Use creditPaymentSourceAccount
            showMessage("Please select a source account for payback.", "warning");
            return;
        }

        const currentCreditDebt = userProfile.accounts?.CreditCard?.balance ?? 0;
        const sourceAccountBalance = userProfile.accounts?.[creditPaymentSourceAccount]?.balance ?? 0;

        if (sourceAccountBalance < amount) {
            showMessage(`Insufficient funds in your ${creditPaymentSourceAccount} account to make this payment.`, 'error');
            return;
        }
        if (currentCreditDebt === 0) {
            showMessage("Your credit card has no outstanding balance.", 'info');
            return;
        }
        if (amount > currentCreditDebt) {
            showMessage(`You are trying to pay back more than your outstanding balance of ₽${currentCreditDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`, 'warning');
        }

        try {
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, `artifacts/${appId}/users`, userProfile.id);
                const userSnap = await transaction.get(userDocRef);
                const userData = userSnap.data();

                const newCreditDebt = Math.max(0, (userData.accounts?.CreditCard?.balance ?? 0) - amount);
                const newSourceAccountBalance = (userData.accounts?.[creditPaymentSourceAccount]?.balance ?? 0) - amount;

                const newTransactions = [...(userData.transactions || []), {
                    date: new Date().toLocaleDateString('en-US'),
                    description: `Credit Card Payment from ${creditPaymentSourceAccount}`,
                    amount: -amount,
                    status: 'Completed'
                },
                {
                    date: new Date().toLocaleDateString('en-US'),
                    description: `Credit Card Balance Reduced`,
                    amount: amount,
                    status: 'Completed'
                }];

                transaction.update(userDocRef, {
                    'accounts.CreditCard.balance': newCreditDebt,
                    [`accounts.${creditPaymentSourceAccount}.balance`]: newSourceAccountBalance,
                    transactions: newTransactions,
                    lastCreditCardPaymentDate: new Date().toISOString(),
                    missedCreditCardPayments: 0,
                    lastCreditCardInterestAppliedDate: new Date().toISOString(),
                    overCreditPenaltyApplied: false
                });
            });
            showMessage(`Successfully paid back ₽${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} on your credit card.`, 'success');
            setCreditPaymentAmount(''); // Reset for new modal
            setCreditPaymentSourceAccount(''); // Reset for new modal
            setShowCreditPaymentModal(false); // Close the new credit payment modal
            await fetchUserProfile();
        } catch (error) {
            console.error("Failed to pay back credit card:", error);
            showMessage(`Failed to pay back credit card: ${error.message}`, 'error');
        }
    };


    const handleLoanPayment = async (e) => {
        e.preventDefault();
        if (!selectedLoanToPay) return;

        const amount = parseFloat(loanPaymentAmount);
        if (isNaN(amount) || amount <= 0 || !loanPaymentSourceAccount) {
            showMessage("Please enter a valid amount and select a source account.", "warning");
            return;
        }

        const sourceAccountBalance = userProfile.accounts?.[loanPaymentSourceAccount]?.balance ?? 0;
        if (sourceAccountBalance < amount) {
            showMessage(`Insufficient funds in your ${loanPaymentSourceAccount} account to make this payment.`, 'error');
            return;
        }

        const loanOutstanding = (selectedLoanToPay.amount - selectedLoanToPay.paidAmount) + (selectedLoanToPay.totalInterestAccrued || 0);
        if (amount > loanOutstanding) {
            showMessage(`You are trying to pay more than the outstanding loan balance of ₽${loanOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`, 'warning');
            // Allow overpayment, but warn
        }

        try {
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, `artifacts/${appId}/users`, userProfile.id);
                const userSnap = await transaction.get(userDocRef);
                const userData = userSnap.data();

                const updatedLoanHistory = userData.loanHistory.map(loan => {
                    if (loan.loanId === selectedLoanToPay.loanId) {
                        const newPaidAmount = (loan.paidAmount ?? 0) + amount;
                        let newStatus = loan.status;
                        if (newPaidAmount >= loan.amount + (loan.totalInterestAccrued ?? 0)) {
                            newStatus = 'Paid Off';
                        }
                        return {
                            ...loan,
                            paidAmount: newPaidAmount,
                            status: newStatus,
                            lastPaymentDate: new Date().toISOString(),
                            missedPayments: 0 // Reset missed payments on successful payment
                        };
                    }
                    return loan;
                });

                const newSourceAccountBalance = (userData.accounts?.[loanPaymentSourceAccount]?.balance ?? 0) - amount;

                const newTransactions = [...(userData.transactions || []), {
                    date: new Date().toLocaleDateString('en-US'),
                    description: `Loan Payment for ${selectedLoanToPay.type} loan (ID: ${selectedLoanToPay.loanId?.substring(0, 8)})`,
                    amount: -amount,
                    status: 'Completed'
                }];

                transaction.update(userDocRef, {
                    loanHistory: updatedLoanHistory,
                    [`accounts.${loanPaymentSourceAccount}.balance`]: newSourceAccountBalance,
                    transactions: newTransactions
                });
            });
            showMessage(`Successfully paid ₽${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} towards your loan.`, 'success');
            setShowLoanPaymentModal(false);
            setLoanPaymentAmount('');
            setLoanPaymentSourceAccount('');
            setSelectedLoanToPay(null);
            await fetchUserProfile();
        } catch (error) {
            console.error("Failed to make loan payment:", error);
            showMessage(`Failed to make loan payment: ${error.message}`, 'error');
        }
    };


    const handleSignOut = async () => {
        try {
            await auth.signOut();
            setUserProfile(null);
            setCurrentView('home');
            showMessage('Signed out successfully!', 'success');
        } catch (error) {
            console.error("Error signing out:", error);
            showMessage(`Failed to sign out: ${error.message}`, "error");
        }
    };

    if (!userProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background, color: COLORS.typography }}>
                <p className="text-xl">Loading user profile...</p>
            </div>
        );
    }

    // Filter accounts for display and selection, now correctly accessing nested balance
    // and explicitly excluding non-account properties like 'CreditCardLimit'
    const availableAccounts = Object.entries(userProfile.accounts || {})
        .filter(([key, accountDetails]) =>
            typeof accountDetails === 'object' && accountDetails !== null &&
            (accountDetails?.balance ?? 0) > 0 &&
            key !== 'CreditCardLimit'
        )
        .map(([type]) => type);

    const paybackSourceAccounts = Object.entries(userProfile.accounts || {})
        .filter(([key, accountDetails]) =>
            typeof accountDetails === 'object' && accountDetails !== null &&
            (accountDetails?.balance ?? 0) > 0 &&
            key !== 'CreditCard' && // Exclude CreditCard itself as a source
            key !== 'CreditCardLimit' // Also exclude the limit property
        )
        .map(([type]) => type);

    const allUserAccounts = Object.entries(userProfile.accounts || {})
        .filter(([key, accountDetails]) =>
            typeof accountDetails === 'object' && accountDetails !== null &&
            key !== 'CreditCardLimit' // Exclude the limit property
        )
        .map(([type]) => type);


    // Calculate loan summary
    const totalLoansTaken = userProfile.loanHistory?.reduce((sum, loan) => sum + (loan.amount || 0), 0) || 0;
    const totalPaidOff = userProfile.loanHistory?.reduce((sum, loan) => sum + (loan.paidAmount || 0), 0) || 0;
    const outstandingLoanBalance = userProfile.loanHistory?.reduce((sum, loan) => {
        if (loan.status === 'Active' || loan.status === 'Defaulted') {
            return sum + ((loan.amount || 0) - (loan.paidAmount || 0) + (loan.totalInterestAccrued || 0));
        }
        return sum;
    }, 0) || 0;

    // Calculate credit summary
    const totalCreditLimit = userProfile.accounts?.CreditCardLimit === Infinity ? Infinity : (userProfile.accounts?.CreditCardLimit ?? 0);
    const totalUsedCredit = userProfile.accounts?.CreditCard?.balance ?? 0;
    const availableCredit = totalCreditLimit === Infinity ? Infinity : totalCreditLimit - totalUsedCredit;

    // Calculate hours till next credit card payment
    // Assuming 12 hours = 1 month. If 0 hours since last payment, next payment is in 12 hours.
    // If 1 hour since last payment, next payment is in 11 hours.
    // If 12 hours since last payment, it's due now, and next payment is in 12 hours (for the next cycle).
    const hoursTillNextCreditPayment = userProfile.lastCreditCardPaymentDate ?
        (12 - (Math.floor((new Date().getTime() - new Date(userProfile.lastCreditCardPaymentDate).getTime()) / (1000 * 60 * 60)) % 12 || 12)) : 'N/A';


    // Function to handle clicking on an account card to show its details
    const handleAccountCardClick = (accountType, accountDetails) => {
        let cardDetails = null;
        const generateSegment = () => Math.floor(1000 + Math.random() * 9000).toString();

        if (accountType === 'Checking') { // Renamed from Personal to Checking
            // Assuming userProfile.debitCard holds the details for the Checking/Personal account's debit card
            cardDetails = {
                type: 'Debit',
                accountType: 'Checking',
                number: userProfile.debitCard?.number || `XXXX ${generateSegment()} ${generateSegment()} ${generateSegment()}`,
                expiry: userProfile.debitCard?.expiry || 'MM/YY',
                cvv: userProfile.debitCard?.cvv || 'XXX',
                pin: userProfile.debitCard?.pin || 'XXXX',
                accountNumber: accountDetails.accountNumber
            };
        } else if (accountType === 'Business') {
             // Placeholder for Business Debit Card, as current userProfile.debitCard structure doesn't support it
             cardDetails = {
                type: 'Business Debit',
                accountType: 'Business',
                number: `5XXX ${generateSegment()} ${generateSegment()} ${generateSegment()}`, // Mock number for business
                expiry: '12/28', // Mock expiry
                cvv: '987', // Mock CVV
                pin: '5678', // Mock PIN
                accountNumber: accountDetails.accountNumber
            };
        } else if (accountType === 'CreditCard') {
            // Assuming userProfile.debitCard holds the details for the Credit Card if hasCreditCard is true
            cardDetails = {
                type: 'Credit',
                accountType: 'Credit Card',
                number: userProfile.debitCard?.number || `4XXX ${generateSegment()} ${generateSegment()} ${generateSegment()}`, // Use actual or mock
                expiry: userProfile.debitCard?.expiry || 'MM/YY',
                cvv: userProfile.debitCard?.cvv || 'XXX',
                pin: userProfile.debitCard?.pin || 'XXXX',
                accountNumber: accountDetails.accountNumber
            };
        } else {
            // For other accounts or if no specific card generated/available, show generic info
            cardDetails = {
                type: `${accountType} Account`,
                accountType: accountType,
                accountNumber: accountDetails.accountNumber,
                generic: true
            };
        }
        setSelectedAccountCardDetails(cardDetails);
        setShowAccountCardModal(true);
    };


    return (
        <div className="min-h-screen flex flex-col items-center p-8" style={{ backgroundColor: COLORS.background, color: COLORS.typography }}>
            {/* Top Navigation Bar */}
            <header className="w-full max-w-6xl p-4 flex justify-between items-center shadow-md rounded-lg mb-8" style={{ backgroundColor: COLORS.secondaryAccent }}>
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold" style={{ color: COLORS.primaryAccent }}>Sberbank</h1>
                </div>
                <div className="flex items-center space-x-4 relative">
                    <div
                        className="relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer text-lg font-bold"
                        style={{ backgroundColor: COLORS.primaryAccent, color: COLORS.background }}
                        onMouseEnter={() => setShowProfileDetails(true)}
                        onMouseLeave={() => setShowProfileDetails(false)}
                    >
                        {getUserInitials(userProfile.name)}
                        {showProfileDetails && (
                            <GlassCard className="absolute right-0 top-full mt-2 p-4 text-sm z-20 min-w-[200px]" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography, boxShadow: `0 0 15px ${COLORS.buttonsGlow}` }}>
                                {/* Explicitly setting text color for better visibility */}
                                <p style={{ color: COLORS.typography }}><span className="font-semibold" style={{ color: COLORS.primaryAccent }}>User ID:</span> {userProfile.discordId}</p>
                                <p style={{ color: COLORS.typography }}><span className="font-semibold" style={{ color: COLORS.primaryAccent }}>Bank ID:</span> {userProfile.bankId}</p>
                                <p style={{ color: COLORS.typography }}><span className="font-semibold" style={{ color: COLORS.primaryAccent }}>Role:</span> {userProfile.specialRole}</p>
                                <p style={{ color: COLORS.typography }}><span className="font-semibold" style={{ color: COLORS.primaryAccent }}>Membership Level:</span> {userProfile.userTier}</p>
                                <p style={{ color: COLORS.typography }}><span className="font-semibold" style={{ color: COLORS.primaryAccent }}>Credit Score:</span> {userProfile.creditScore}</p>
                            </GlassCard>
                        )}
                    </div>
                    <button onClick={handleSignOut} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
                        <LogOut size={20} className="inline mr-2" /> Sign Out
                    </button>
                </div>
            </header>

            {/* Main Navigation Tabs */}
            <nav className="w-full max-w-4xl flex justify-around p-4 mb-8 rounded-lg shadow-md" style={{ backgroundColor: COLORS.secondaryAccent }}>
                <button
                    onClick={() => setActiveTab('home')}
                    className={`flex flex-col items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${activeTab === 'home' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                >
                    <LayoutDashboard size={24} />
                    <span className="text-xs mt-1">Home</span>
                </button>
                <button
                    onClick={() => setActiveTab('accounts')}
                    className={`flex flex-col items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${activeTab === 'accounts' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                >
                    <WalletCards size={24} />
                    <span className="text-xs mt-1">Accounts</span>
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`flex flex-col items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${activeTab === 'transactions' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                >
                    <History size={24} />
                    <span className="text-xs mt-1">Transactions</span>
                </button>
                <button
                    onClick={() => setActiveTab('loans')}
                    className={`flex flex-col items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${activeTab === 'loans' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                >
                    <Scale size={24} />
                    <span className="text-xs mt-1">Loans</span>
                </button>
                <button
                    onClick={() => setActiveTab('credit')}
                    className={`flex flex-col items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${activeTab === 'credit' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                >
                    <CreditCard size={24} />
                    <span className="text-xs mt-1">Credit</span>
                </button>
            </nav>

            {/* Conditional Rendering of Sections */}
            {activeTab === 'home' && (
                <>
                    {/* Home Page - Summary Panel */}
                    <section className="w-full max-w-4xl mb-8">
                        <GlassCard className="p-8 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFAA10] to-[#0D0D0D] opacity-20 z-0"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <h2 className="text-2xl font-semibold mb-1" style={{ color: COLORS.typography }}>Overall Balance</h2>
                                <p className="text-6xl font-extrabold mb-4" style={{ color: COLORS.primaryAccent }}>
                                    ₽{userProfile.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                                </p>
                                <div className="text-center mb-6">
                                    <p className="text-lg" style={{ color: COLORS.typography }}>User ID: {userProfile.discordId}</p>
                                    <p className="text-lg" style={{ color: COLORS.typography }}>
                                        Credit Score: <span style={{ color: currentUserMembershipPlan.tierColor }}>{userProfile.creditScore ?? 'N/A'}</span>
                                    </p>
                                    <p className="text-lg" style={{ color: COLORS.typography }}>
                                        Membership Level: <span style={{ color: COLORS.primaryAccent }}>{currentUserMembershipPlan.name}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowTransactionModal(true)}
                                    className="mt-6 font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
                                    style={{ backgroundColor: COLORS.primaryAccent, color: COLORS.background, boxShadow: `0 0 15px ${COLORS.buttonsGlow}` }}
                                >
                                    Make a Transaction
                                </button>
                            </div>
                        </GlassCard>
                    </section>

                    {/* Home Page - Quick Actions Section */}
                    <section className="w-full max-w-4xl mb-8">
                        <h2 className="text-3xl font-bold mb-6" style={{ color: COLORS.primaryAccent }}>Quick Actions</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            <button
                                onClick={() => setShowOpenAccountModal(true)}
                                className="p-4 rounded-lg flex flex-col items-center justify-center text-center transform hover:scale-105 transition-all duration-200"
                                style={{ backgroundColor: COLORS.secondaryAccent, boxShadow: `0 0 10px ${COLORS.buttonsGlow}` }}
                            >
                                <PlusCircle size={36} style={{ color: COLORS.primaryAccent }} />
                                <span className="mt-2 text-lg font-semibold" style={{ color: COLORS.typography }}>Open New Account</span>
                            </button>
                            <button
                                onClick={() => showMessage("Account security settings coming soon!", "info")}
                                className="p-4 rounded-lg flex flex-col items-center justify-center text-center transform hover:scale-105 transition-all duration-200"
                                style={{ backgroundColor: COLORS.secondaryAccent, boxShadow: `0 0 10px ${COLORS.buttonsGlow}` }}
                            >
                                <Lock size={36} style={{ color: COLORS.primaryAccent }} />
                                <span className="mt-2 text-lg font-semibold" style={{ color: COLORS.typography }}>Account Security</span>
                            </button>
                            {/* Placeholder for Most Used Feature 1 */}
                            <button
                                onClick={() => showMessage("This will be your most used feature 1!", "info")}
                                className="p-4 rounded-lg flex flex-col items-center justify-center text-center transform hover:scale-105 transition-all duration-200"
                                style={{ backgroundColor: COLORS.secondaryAccent, boxShadow: `0 0 10px ${COLORS.buttonsGlow}` }}
                            >
                                <TrendingUpIcon size={36} style={{ color: COLORS.primaryAccent }} />
                                <span className="mt-2 text-lg font-semibold" style={{ color: COLORS.typography }}>My Top Feature 1</span>
                            </button>
                            {/* Placeholder for Most Used Feature 2 */}
                            <button
                                onClick={() => showMessage("This will be your most used feature 2!", "info")}
                                className="p-4 rounded-lg flex flex-col items-center justify-center text-center transform hover:scale-105 transition-all duration-200"
                                style={{ backgroundColor: COLORS.secondaryAccent, boxShadow: `0 0 10px ${COLORS.buttonsGlow}` }}
                            >
                                <Settings size={36} style={{ color: COLORS.primaryAccent }} />
                                <span className="mt-2 text-lg font-semibold" style={{ color: COLORS.typography }}>My Top Feature 2</span>
                            </button>
                        </div>
                    </section>
                </>
            )}

            {activeTab === 'accounts' && (
                <>
                    {/* Account Overview Page Section */}
                    <section className="w-full max-w-4xl mb-8">
                        <h2 className="text-3xl font-bold mb-6" style={{ color: COLORS.primaryAccent }}>Account Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(userProfile.accounts || {})
                                .filter(([key, accountDetails]) =>
                                    // Filter out non-object properties and the CreditCardLimit property
                                    typeof accountDetails === 'object' && accountDetails !== null && key !== 'CreditCardLimit'
                                )
                                .map(([accountType, accountDetails]) => (
                                    // Only display CreditCard if it's explicitly a credit card account (type 'Credit' in debitCard)
                                    (accountType !== 'CreditCard' || userProfile.debitCard?.type === 'Credit') && (
                                        <GlassCard
                                            key={accountType}
                                            className="p-6 flex flex-col justify-between cursor-pointer transform hover:scale-105 transition-all duration-200"
                                            onClick={() => handleAccountCardClick(accountType === 'Personal' ? 'Checking' : accountType, accountDetails)} // Rename Personal to Checking for display
                                        >
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.typography }}>
                                                    {accountType === 'Personal' ? 'Checking' : accountType} Account {/* Display "Checking" */}
                                                </h3>
                                                <p className="text-3xl font-bold" style={{ color: accountType === 'CreditCard' ? COLORS.danger : COLORS.primaryAccent }}>
                                                    ₽{(accountDetails?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                                {accountDetails?.accountNumber && (
                                                    <p className="text-sm font-mono text-gray-400 mt-1">Account No: {accountDetails.accountNumber}</p>
                                                )}
                                                {accountType === 'CreditCard' && userProfile.hasCreditCard && (
                                                    <>
                                                        <p className="text-sm" style={{ color: COLORS.typography }}>
                                                            Limit: {userProfile.accounts.CreditCardLimit === Infinity ? 'Unlimited' : `₽${(userProfile.accounts.CreditCardLimit ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                        </p>
                                                        <p className="text-sm" style={{ color: COLORS.typography }}>
                                                            Available: {userProfile.accounts.CreditCardLimit === Infinity ? 'Unlimited' : `₽${(userProfile.accounts.CreditCardLimit - (userProfile.accounts?.CreditCard?.balance ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                            {accountType === 'CreditCard' && userProfile.hasCreditCard && (
                                                <div className="flex space-x-2 mt-4">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setActiveTab('credit'); }} // Link to the new credit page, stop propagation to prevent card modal
                                                        className="flex-1 px-4 py-2 rounded-lg font-medium text-sm bg-blue-700 text-white hover:bg-blue-800 transition-colors duration-200"
                                                    >
                                                        Manage Card
                                                    </button>
                                                </div>
                                            )}
                                        </GlassCard>
                                    )
                                ))}
                        </div>
                    </section>

                    {userProfile.debitCard && userProfile.debitCard.type === 'Debit' && (
                        <section className="w-full max-w-4xl mb-8">
                            <h3 className="text-3xl font-bold mb-6" style={{ color: COLORS.typography }}>💳 Your Debit Card</h3>
                            <GlassCard className="p-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#00FFAA10] to-[#0D0D0D] opacity-20 z-0"></div>
                                <div className="relative z-10 text-white">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-lg font-semibold">Sberbank Debit Card</span>
                                        <img src="https://placehold.co/40x25/00FFAA/0D0D0D?text=VISA" alt="Visa Logo" className="h-6" />
                                    </div>
                                    <p className="text-3xl font-mono tracking-wider mb-4">{userProfile.debitCard.number}</p>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Valid Thru: {userProfile.debitCard.expiry}</span>
                                        <span>CVV: {userProfile.debitCard.cvv}</span>
                                    </div>
                                    <p className="text-sm">PIN: {userProfile.debitCard.pin}</p>
                                    <p className="text-xl font-bold mt-4">Balance: {userProfile.accounts.Personal?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'} RUB</p>
                                </div>
                            </GlassCard>
                        </section>
                    )}
                </>
            )}

            {activeTab === 'transactions' && (
                <>
                    {/* Transaction History Page Section */}
                    <section className="w-full max-w-4xl mb-8">
                        <h2 className="text-3xl font-bold mb-6" style={{ color: COLORS.primaryAccent }}>Transaction History</h2>
                        <GlassCard className="p-6 overflow-x-auto">
                            {userProfile.transactions && userProfile.transactions.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead style={{ color: COLORS.primaryAccent }}>
                                        <tr>
                                            <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Date</th>
                                            <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Description</th>
                                            <th className="py-3 px-4 text-right text-sm font-semibold uppercase tracking-wider">Amount</th>
                                            <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {userProfile.transactions.slice().reverse().map((transaction, index) => (
                                            <tr key={index} className="hover:bg-white hover:bg-opacity-10 transition-colors duration-200">
                                                <td className="py-3 px-4">{transaction.date}</td>
                                                <td className="py-3 px-4">{transaction.description}</td>
                                                <td className={`py-3 px-4 text-right ${transaction.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                    ₽{transaction.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                                                </td>
                                                <td className="py-3 px-4">{transaction.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-400">No transactions yet.</p>
                            )}
                        </GlassCard>
                    </section>
                </>
            )}

            {activeTab === 'loans' && (
                <>
                    {/* Loan History Page Section */}
                    <section className="w-full max-w-4xl mb-8">
                        <h2 className="text-3xl font-bold mb-6" style={{ color: COLORS.primaryAccent }}>Loan History</h2>
                        <GlassCard className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                                <div className="p-4 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent }}>
                                    <p className="text-md font-semibold" style={{ color: COLORS.typography }}>Total Loans Taken</p>
                                    <p className="text-2xl font-bold" style={{ color: COLORS.primaryAccent }}>₽{totalLoansTaken.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="p-4 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent }}>
                                    <p className="text-md font-semibold" style={{ color: COLORS.typography }}>Total Paid Off</p>
                                    <p className="text-2xl font-bold" style={{ color: COLORS.success }}>₽{totalPaidOff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="p-4 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent }}>
                                    <p className="text-md font-semibold" style={{ color: COLORS.typography }}>Outstanding Balance</p>
                                    <p className="text-2xl font-bold" style={{ color: COLORS.danger }}>₽{outstandingLoanBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                            </div>

                            {userProfile.loanHistory && userProfile.loanHistory.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead style={{ color: COLORS.primaryAccent }}>
                                            <tr>
                                                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Loan ID</th>
                                                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Type</th>
                                                <th className="py-3 px-4 text-right text-sm font-semibold uppercase tracking-wider">Principal</th>
                                                <th className="py-3 px-4 text-right text-sm font-semibold uppercase tracking-wider">Outstanding</th>
                                                <th className="py-3 px-4 text-right text-sm font-semibold uppercase tracking-wider">Interest Rate</th>
                                                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                                                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Hours Till Next Payment</th> {/* Changed column header */}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                        {userProfile.loanHistory.map((loan, index) => {
                                            const hoursSinceLastPayment = loan.lastPaymentDate ?
                                                Math.floor((new Date().getTime() - new Date(loan.lastPaymentDate).getTime()) / (1000 * 60 * 60)) : 0;
                                            const hoursTillNextPayment = (loan.status === 'Active' || loan.status === 'Defaulted')
                                                ? (12 - (hoursSinceLastPayment % 12 === 0 ? 12 : hoursSinceLastPayment % 12))
                                                : 'N/A'; // If 0, it means it's due now or has just passed, so next payment is 12 hours from now.

                                            return (
                                                <tr key={loan.loanId || index} className="hover:bg-white hover:bg-opacity-10 transition-colors duration-200">
                                                    <td className="py-3 px-4 text-sm">{loan.loanId?.substring(0, 8)}...</td>
                                                    <td className="py-3 px-4">{loan.type}</td>
                                                    <td className="py-3 px-4 text-right">₽{(loan.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="py-3 px-4 text-right">₽{((loan.amount ?? 0) - (loan.paidAmount ?? 0) + (loan.totalInterestAccrued ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="py-3 px-4 text-right">{((loan.interestRate ?? 0) * 100).toFixed(2)}%</td>
                                                    <td className="py-3 px-4">{loan.status}</td>
                                                    <td className="py-3 px-4">
                                                        {hoursTillNextPayment === 'N/A'
                                                            ? 'N/A'
                                                            : hoursTillNextPayment === 0 && (loan.status === 'Active' || loan.status === 'Defaulted')
                                                                ? 'Due Now'
                                                                : `${hoursTillNextPayment} hours`}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-400">No loan history yet.</p>
                            )}
                            {userProfile.loanHistory && userProfile.loanHistory.some(loan => loan.status === 'Active') && (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => {
                                            // Find the first active loan to pre-select for payment
                                            const activeLoan = userProfile.loanHistory.find(loan => loan.status === 'Active');
                                            if (activeLoan) {
                                                setSelectedLoanToPay(activeLoan);
                                                setShowLoanPaymentModal(true);
                                            } else {
                                                showMessage("No active loans to pay.", "info");
                                            }
                                        }}
                                        className="font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
                                        style={{ backgroundColor: COLORS.primaryAccent, color: COLORS.background, boxShadow: `0 0 15px ${COLORS.buttonsGlow}` }}
                                    >
                                        Make Loan Payment
                                    </button>
                                </div>
                            )}
                        </GlassCard>
                    </section>
                </>
            )}

            {activeTab === 'credit' && (
                <>
                    {/* Credit Overview Page Section */}
                    <section className="w-full max-w-4xl mb-8">
                        <h2 className="text-3xl font-bold mb-6" style={{ color: COLORS.primaryAccent }}>Credit Overview</h2>
                        <GlassCard className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                                <div className="p-4 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent }}>
                                    <p className="text-md font-semibold" style={{ color: COLORS.typography }}>Total Credit Limit</p>
                                    <p className="text-2xl font-bold" style={{ color: COLORS.primaryAccent }}>
                                        {totalCreditLimit === Infinity ? 'Unlimited' : `₽${totalCreditLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent }}>
                                    <p className="text-md font-semibold" style={{ color: COLORS.typography }}>Total Used Credit</p>
                                    <p className="text-2xl font-bold" style={{ color: COLORS.danger }}>₽{totalUsedCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="p-4 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent }}>
                                    <p className="text-md font-semibold" style={{ color: COLORS.typography }}>Available Credit</p>
                                    <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
                                        {availableCredit === Infinity ? 'Unlimited' : `₽${availableCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </p>
                                </div>
                            </div>
                            {userProfile.hasCreditCard && (
                                <div className="text-center mb-6">
                                    <p className="text-lg font-semibold" style={{ color: COLORS.typography }}>
                                        Hours Till Next Payment: <span style={{ color: COLORS.primaryAccent }}>
                                            {hoursTillNextCreditPayment === 'N/A'
                                                ? 'N/A'
                                                : hoursTillNextCreditPayment === 0 && totalUsedCredit > 0
                                                    ? 'Due Now'
                                                    : `${hoursTillNextCreditPayment} hours`}
                                        </span>
                                    </p>
                                    <p className="text-lg font-semibold" style={{ color: COLORS.typography }}>
                                        Current Interest Rate: <span style={{ color: COLORS.primaryAccent }}>{((userProfile.creditCardInterestRate ?? 0) * 100).toFixed(2)}% Monthly</span>
                                    </p>
                                </div>
                            )}

                            {!userProfile.hasCreditCard ? (
                                <p className="text-gray-400 text-center">You do not have a credit card. Request one via the 'Make a Transaction' menu.</p>
                            ) : (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => setShowCreditPaymentModal(true)} // Open the new credit payment modal
                                        className="font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
                                        style={{ backgroundColor: COLORS.primaryAccent, color: COLORS.background, boxShadow: `0 0 15px ${COLORS.buttonsGlow}` }}
                                    >
                                        Make Credit Card Payment
                                    </button>
                                </div>
                            )}
                        </GlassCard>
                    </section>
                </>
            )}


            {/* Footer */}
            <footer className="w-full max-w-6xl p-4 text-center text-gray-500 text-sm mt-8">
                <div className="flex justify-center space-x-4 mb-2">
                    <a href="#" className="hover:text-white transition-colors duration-200">Support</a>
                    <span className="text-gray-600">|</span>
                    <a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
                    <span className="text-gray-600">|</span>
                    <a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a>
                </div>
                <p>&copy; {new Date().getFullYear()} Sberbank. All rights reserved.</p>
            </footer>


            {/* Open New Account Modal */}
            {showOpenAccountModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-3xl font-bold mb-6 text-center" style={{ color: COLORS.primaryAccent }}>Open New Account</h3>
                        <form onSubmit={handleOpenAccount} className="space-y-4">
                            <div>
                                <label htmlFor="newAccountType" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Account Type</label>
                                <select
                                    id="newAccountType"
                                    value={newAccountType}
                                    onChange={(e) => setNewAccountType(e.target.value)}
                                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                    style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                    required
                                >
                                    <option value="">Select Account Type</option>
                                    <option value="Personal">Checking Account</option> {/* Renamed Personal to Checking */}
                                    <option value="Savings">Savings Account</option>
                                    <option value="Business">Business Account</option>
                                    <option value="Government" disabled>(Coming soon) Government Account</option> {/* Disabled and added text */}
                                    <option value="Investment" disabled>(Coming soon) Investment Account</option> {/* Disabled and added text */}
                                    <option value="Shadow">Shadow Account</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="newAccountInitialDeposit" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Initial Deposit</label>
                                <input
                                    type="number"
                                    id="newAccountInitialDeposit"
                                    value={newAccountInitialDeposit}
                                    onChange={(e) => setNewAccountInitialDeposit(e.target.value)}
                                    placeholder="e.g., 100.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                    style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                    required
                                />
                            </div>
                            {newAccountType === 'Business' && (
                                <div>
                                    <label htmlFor="newAccountBusinessRegId" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Business Registration ID</label>
                                    <input
                                        type="text"
                                        id="newAccountBusinessRegId"
                                        value={newAccountBusinessRegId}
                                        onChange={(e) => setNewAccountBusinessRegId(e.target.value)}
                                        placeholder="e.g., BIZ-12345"
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    />
                                </div>
                            )}
                            {newAccountType === 'Government' && (
                                <div>
                                    <label htmlFor="newAccountMinistryName" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Ministry/Agency Name</label>
                                    <input
                                        type="text"
                                        id="newAccountMinistryName"
                                        value={newAccountMinistryName}
                                        onChange={(e) => setNewAccountMinistryName(e.target.value)}
                                        placeholder="e.g., Ministry of Finance"
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    />
                                </div>
                            )}
                            <div>
                                <label htmlFor="newAccountProofOfFunds" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Proof of Funds Link (e.g., Discord link)</label>
                                <input
                                    type="url"
                                    id="newAccountProofOfFunds"
                                    value={newAccountProofOfFunds}
                                    onChange={(e) => setNewAccountProofOfFunds(e.target.value)}
                                    placeholder="https://discord.com/channels/..."
                                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                    style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowOpenAccountModal(false)}
                                    className="px-6 py-2 rounded-lg font-bold bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* Transaction Services Modal */}
            {showTransactionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-3xl font-bold mb-6 text-center" style={{ color: COLORS.primaryAccent }}>Make a Transaction</h3>

                        {/* Internal Navigation for Transaction Types */}
                        <div className="flex justify-center space-x-4 mb-6">
                            <button
                                onClick={() => setTransactionServiceTab('deposit')}
                                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${transactionServiceTab === 'deposit' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                Deposit
                            </button>
                            <button
                                onClick={() => setTransactionServiceTab('withdraw')}
                                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${transactionServiceTab === 'withdraw' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                Withdraw
                            </button>
                            <button
                                onClick={() => setTransactionServiceTab('transfer')}
                                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${transactionServiceTab === 'transfer' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                Transfer
                            </button>
                            <button
                                onClick={() => setTransactionServiceTab('loan')}
                                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${transactionServiceTab === 'loan' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                Loan
                            </button>
                            <button
                                onClick={() => setTransactionServiceTab('creditCard')}
                                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${transactionServiceTab === 'creditCard' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                Credit Card
                            </button>
                        </div>

                        {/* Conditional Rendering of Transaction Forms */}
                        {transactionServiceTab === 'deposit' && (
                            <form onSubmit={handleDeposit} className="space-y-4">
                                <h4 className="text-xl font-bold" style={{ color: COLORS.typography }}>Deposit Funds</h4>
                                <div>
                                    <label htmlFor="modalDepositAccount" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Deposit To Account</label>
                                    <select
                                        id="modalDepositAccount"
                                        value={depositAccount}
                                        onChange={(e) => setDepositAccount(e.target.value)}
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    >
                                        <option value="">Select Account</option>
                                        {allUserAccounts.map(accountType => (
                                            <option key={accountType} value={accountType}>{accountType === 'Personal' ? 'Checking' : accountType}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="modalDepositAmount" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Amount</label>
                                    <input
                                        type="number"
                                        id="modalDepositAmount"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="e.g., 1000.00"
                                        step="0.01"
                                        min="0.01"
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="modalDepositDiscordLink" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Discord Proof Link</label>
                                    <input
                                        type="url"
                                        id="modalDepositDiscordLink"
                                        value={depositDiscordLink}
                                        onChange={(e) => setDepositDiscordLink(e.target.value)}
                                        placeholder="https://discord.com/channels/..."
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300" style={{ backgroundColor: COLORS.primaryAccent, color: COLORS.background, boxShadow: `0 0 15px ${COLORS.buttonsGlow}` }}>
                                    Submit Deposit Request
                                </button>
                            </form>
                        )}

                        {transactionServiceTab === 'withdraw' && (
                            <form onSubmit={handleWithdrawal} className="space-y-4">
                                <h4 className="text-xl font-bold" style={{ color: COLORS.typography }}>Withdraw Funds</h4>
                                <div>
                                    <label htmlFor="modalWithdrawalAccount" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Withdraw From Account</label>
                                    <select
                                        id="modalWithdrawalAccount"
                                        value={withdrawalAccount}
                                        onChange={(e) => setWithdrawalAccount(e.target.value)}
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    >
                                        <option value="">Select Account</option>
                                        {availableAccounts.map(accountType => (
                                            <option key={accountType} value={accountType}>{accountType === 'Personal' ? 'Checking' : accountType}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="modalWithdrawalAmount" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Amount</label>
                                    <input
                                        type="number"
                                        id="modalWithdrawalAmount"
                                        value={withdrawalAmount}
                                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                                        placeholder="e.g., 500.00"
                                        step="0.01"
                                        min="0.01"
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300" style={{ backgroundColor: COLORS.primaryAccent, color: COLORS.background, boxShadow: `0 0 15px ${COLORS.buttonsGlow}` }}>
                                    Submit Withdrawal Request
                                </button>
                            </form>
                        )}

                        {transactionServiceTab === 'transfer' && (
                            <form onSubmit={handleTransfer} className="space-y-4">
                                <h4 className="text-xl font-bold" style={{ color: COLORS.typography }}>Internal Transfer</h4>
                                <div>
                                    <label htmlFor="modalTransferFromAccount" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>From Your Account</label>
                                    <select
                                        id="modalTransferFromAccount"
                                        value={transferFromAccount}
                                        onChange={(e) => setTransferFromAccount(e.target.value)}
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    >
                                        <option value="">Select Account</option>
                                        {availableAccounts.map(accountType => (
                                            <option key={accountType} value={accountType}>{accountType === 'Personal' ? 'Checking' : accountType}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="modalTransferAmount" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Amount</label>
                                    <input
                                        type="number"
                                        id="modalTransferAmount"
                                        value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value)}
                                        placeholder="e.g., 200.00"
                                        step="0.01"
                                        min="0.01"
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="modalTransferRecipientUserId" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Recipient User ID (Discord ID)</label>
                                    <input
                                        type="text"
                                        id="modalTransferRecipientUserId"
                                        value={transferRecipientUserId}
                                        onChange={(e) => setTransferRecipientUserId(e.target.value)}
                                        placeholder="Recipient's Discord ID (e.g., User#1234)"
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="modalTransferRecipientAccountNumber" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Recipient Account Number</label>
                                    <input
                                        type="text"
                                        id="modalTransferRecipientAccountNumber"
                                        value={transferRecipientAccountNumber}
                                        onChange={(e) => setTransferRecipientAccountNumber(e.target.value)}
                                        placeholder="Recipient's 10-digit Account Number"
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300" style={{ backgroundColor: COLORS.primaryAccent, color: COLORS.background, boxShadow: `0 0 15px ${COLORS.buttonsGlow}` }}>
                                    Submit Transfer Request
                                </button>
                            </form>
                        )}

                        {transactionServiceTab === 'loan' && (
                            <form onSubmit={handleRequestLoan} className="space-y-4">
                                <h4 className="text-xl font-bold" style={{ color: COLORS.typography }}>Request Loan</h4>
                                <div>
                                    <label htmlFor="modalLoanType" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Loan Type</label>
                                    <select
                                        id="modalLoanType"
                                        value={loanType}
                                        onChange={(e) => setLoanType(e.target.value)}
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    >
                                        <option value="">Select Loan Type</option>
                                        {Object.keys(currentUserMembershipPlan.loanEligibility).map(type => (
                                            currentUserMembershipPlan.loanEligibility[type] > 0 && <option key={type} value={type}>{type} Loan (Max: ₽{currentUserMembershipPlan.loanEligibility[type].toLocaleString()})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="modalLoanAmount" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Amount</label>
                                    <input
                                        type="number"
                                        id="modalLoanAmount"
                                        value={loanAmount}
                                        onChange={(e) => setLoanAmount(e.target.value)}
                                        placeholder="e.g., 10000.00"
                                        step="0.01"
                                        min="0.01"
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="modalLoanPeriod" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Repayment Period (Months)</label>
                                    <input
                                        type="number"
                                        id="modalLoanPeriod"
                                        value={loanPeriod}
                                        onChange={(e) => setLoanPeriod(e.target.value)}
                                        placeholder="e.g., 12"
                                        min="1"
                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    />
                                </div>
                                {/* Interest Rate is now derived, display only */}
                                <div>
                                    <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Annual Interest Rate (Derived from Membership Plan)</label>
                                    <input
                                        type="text"
                                        value={`${(currentUserMembershipPlan.monthlyInterestRate * 100).toFixed(2)}% Monthly`}
                                        className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 cursor-not-allowed"
                                        style={{ color: COLORS.typography }}
                                        readOnly
                                    />
                                </div>
                                {(loanType === 'Mortgage' || loanType === 'Business') && (
                                    <div>
                                        <label htmlFor="modalLoanCollateralLink" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Collateral Link (e.g., Property Deed, Business Assets)</label>
                                        <input
                                            type="url"
                                            id="modalLoanCollateralLink"
                                            value={loanCollateralLink}
                                            onChange={(e) => setLoanCollateralLink(e.target.value)}
                                            placeholder="https://example.com/collateral.pdf"
                                            className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                            style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                            required={loanType === 'Mortgage' || loanType === 'Business'}
                                        />
                                    </div>
                                )}
                                {loanType === 'Mortgage' && (
                                    <>
                                        <div>
                                            <label htmlFor="modalLoanDownPayment" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Down Payment</label>
                                            <input
                                                type="number"
                                                id="modalLoanDownPayment"
                                                value={loanDownPayment}
                                                onChange={(e) => setLoanDownPayment(e.target.value)}
                                                placeholder="e.g., 5000.00"
                                                step="0.01"
                                                min="0"
                                                className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                                style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="modalLoanPropertyRegion" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Property Region</label>
                                            <input
                                                type="text"
                                                id="modalLoanPropertyRegion"
                                                value={loanPropertyRegion}
                                                onChange={(e) => setLoanPropertyRegion(e.target.value)}
                                                placeholder="e.g., Central City"
                                                className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        required
                                    />
                                </div>
                            </>
                        )}
                                <button type="submit" className="w-full font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300" style={{ backgroundColor: COLORS.primaryAccent, color: COLORS.background, boxShadow: `0 0 15px ${COLORS.buttonsGlow}` }}>
                                    Submit Loan Request
                                </button>
                            </form>
                        )}

                        {transactionServiceTab === 'creditCard' && (
                            <div className="space-y-6">
                                <h4 className="text-xl font-bold" style={{ color: COLORS.typography }}>Credit Card Services</h4>

                                {/* Request Credit Card */}
                                {!userProfile.hasCreditCard ? (
                                    <GlassCard className="p-4">
                                        <h5 className="text-lg font-semibold mb-2" style={{ color: COLORS.typography }}>Request New Credit Card</h5>
                                        <p className="text-gray-400 mb-4 text-sm">Your credit limit and interest rate will be determined by your current membership plan: <span className="font-semibold" style={{ color: COLORS.primaryAccent }}>{currentUserMembershipPlan.name} (Max Limit: ₽{currentUserMembershipPlan.baseCreditLimit === Infinity ? 'Unlimited' : currentUserMembershipPlan.baseCreditLimit.toLocaleString()})</span></p>
                                        <form onSubmit={handleRequestCreditCard} className="space-y-4">
                                            <button type="submit" className="w-full font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300" style={{ backgroundColor: COLORS.primaryAccent, color: COLORS.background, boxShadow: `0 0 15px ${COLORS.buttonsGlow}` }}>
                                                Request Credit Card
                                            </button>
                                        </form>
                                    </GlassCard>
                                ) : (
                                    <>
                                        {/* Spend on Credit Card */}
                                        <GlassCard className="p-4">
                                            <h5 className="text-lg font-semibold mb-2" style={{ color: COLORS.typography }}>Spend on Credit Card</h5>
                                            <p className="text-gray-400 mb-4 text-sm">
                                                Credit Card Limit: {userProfile.accounts.CreditCardLimit === Infinity ? 'Unlimited' : `₽${(userProfile.accounts.CreditCardLimit ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} <br/>
                                                Available Credit: {userProfile.accounts.CreditCardLimit === Infinity ? 'Unlimited' : `₽${(userProfile.accounts.CreditCardLimit - (userProfile.accounts?.CreditCard?.balance ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} <br/>
                                                Amount Owed: <span style={{color: COLORS.danger}}>₽{(userProfile.accounts?.CreditCard?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> <br/>
                                                Interest Rate: {((userProfile.creditCardInterestRate ?? 0) * 100).toFixed(2)}% Monthly
                                            </p>
                                            <form onSubmit={handleCreditCardSpend} className="space-y-4">
                                                <div>
                                                    <label htmlFor="modalCreditCardSpendAmount" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Amount to Spend</label>
                                                    <input
                                                        type="number"
                                                        id="modalCreditCardSpendAmount"
                                                        value={creditCardSpendAmount}
                                                        onChange={(e) => setCreditCardSpendAmount(e.target.value)}
                                                        placeholder="e.g., 100.00"
                                                        step="0.01"
                                                        min="0.01"
                                                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                                        required
                                                    />
                                                </div>
                                                <button type="submit" className="w-full font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300" style={{ backgroundColor: COLORS.primaryAccent, color: COLORS.background, boxShadow: `0 0 15px ${COLORS.buttonsGlow}` }}>
                                                    Record Credit Card Spend
                                                </button>
                                            </form>
                                        </GlassCard>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button onClick={() => setShowTransactionModal(false)} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                                Close
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Loan Payment Modal */}
            {showLoanPaymentModal && selectedLoanToPay && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-3xl font-bold mb-6 text-center" style={{ color: COLORS.primaryAccent }}>Pay Loan</h3>
                        <p className="text-lg font-semibold mb-4" style={{ color: COLORS.typography }}>
                            Loan Type: {selectedLoanToPay.type}
                        </p>
                        <p className="text-lg font-semibold mb-4" style={{ color: COLORS.typography }}>
                            Outstanding Balance (incl. Interest): ₽{((selectedLoanToPay.amount ?? 0) - (selectedLoanToPay.paidAmount ?? 0) + (selectedLoanToPay.totalInterestAccrued ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <form onSubmit={handleLoanPayment} className="space-y-4">
                            <div>
                                <label htmlFor="loanPaymentSourceAccount" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Source Account</label>
                                <select
                                    id="loanPaymentSourceAccount"
                                    value={loanPaymentSourceAccount}
                                    onChange={(e) => setLoanPaymentSourceAccount(e.target.value)}
                                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                    style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                    required
                                >
                                    <option value="">Select Account</option>
                                    {paybackSourceAccounts.map(accountType => (
                                        <option key={accountType} value={accountType}>{accountType === 'Personal' ? 'Checking' : accountType}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="loanPaymentAmount" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Amount to Pay</label>
                                <input
                                    type="number"
                                    id="loanPaymentAmount"
                                    value={loanPaymentAmount}
                                    onChange={(e) => setLoanPaymentAmount(e.target.value)}
                                    placeholder="e.g., 100.00"
                                    step="0.01"
                                    min="0.01"
                                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                    style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowLoanPaymentModal(false); setSelectedLoanToPay(null); setLoanPaymentAmount(''); setLoanPaymentSourceAccount(''); }}
                                    className="px-6 py-2 rounded-lg font-bold bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
                                >
                                    Submit Payment
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* Credit Payment Modal */}
            {showCreditPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-3xl font-bold mb-6 text-center" style={{ color: COLORS.primaryAccent }}>Pay Credit Card Bill</h3>
                        <p className="text-lg font-semibold mb-4" style={{ color: COLORS.typography }}>
                            Outstanding Debt: <span style={{color: COLORS.danger}}>₽{(userProfile.accounts?.CreditCard?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </p>
                        <form onSubmit={handleCreditCardPayback} className="space-y-4">
                            <div>
                                <label htmlFor="creditPaymentSourceAccount" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Source Account</label>
                                <select
                                    id="creditPaymentSourceAccount"
                                    value={creditPaymentSourceAccount}
                                    onChange={(e) => setCreditPaymentSourceAccount(e.target.value)}
                                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                    style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                    required
                                >
                                    <option value="">Select Account</option>
                                    {paybackSourceAccounts.map(accountType => (
                                        <option key={accountType} value={accountType}>{accountType === 'Personal' ? 'Checking' : accountType}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="creditPaymentAmount" className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Amount to Pay Back</label>
                                <input
                                    type="number"
                                    id="creditPaymentAmount"
                                    value={creditPaymentAmount}
                                    onChange={(e) => setCreditPaymentAmount(e.target.value)}
                                    placeholder={`Max: ₽${(userProfile.accounts.CreditCard?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    step="0.01"
                                    min="0.01"
                                    max={userProfile.accounts.CreditCard?.balance ?? 0}
                                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                    style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreditPaymentModal(false); setCreditPaymentAmount(''); setCreditPaymentSourceAccount(''); }}
                                    className="px-6 py-2 rounded-lg font-bold bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
                                >
                                    Submit Payment
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* Account Card Display Modal */}
            {showAccountCardModal && selectedAccountCardDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-3xl font-bold mb-6 text-center" style={{ color: COLORS.primaryAccent }}>Your {selectedAccountCardDetails.accountType} Card</h3>
                        <div className="relative p-6 rounded-lg shadow-lg overflow-hidden" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography, minHeight: '200px' }}>
                            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFAA10] to-[#0D0D0D] opacity-20 z-0"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-lg font-semibold">{selectedAccountCardDetails.accountType} {selectedAccountCardDetails.type} Card</span>
                                    {selectedAccountCardDetails.type === 'Debit' && <img src="https://placehold.co/40x25/00FFAA/0D0D0D?text=VISA" alt="Visa Logo" className="h-6" />}
                                    {selectedAccountCardDetails.type === 'Credit' && <img src="https://placehold.co/40x25/00FFAA/0D0D0D?text=VISA" alt="Visa Logo" className="h-6" />}
                                    {selectedAccountCardDetails.type === 'Business Debit' && <Briefcase size={30} style={{ color: COLORS.primaryAccent }} />}
                                </div>
                                {selectedAccountCardDetails.generic ? (
                                    <>
                                        <p className="text-xl font-mono tracking-wider mb-4">Account Number: {selectedAccountCardDetails.accountNumber}</p>
                                        <p className="text-sm">No specific card details generated for this account type. Displaying account number.</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-3xl font-mono tracking-wider mb-4">{selectedAccountCardDetails.number}</p>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Valid Thru: {selectedAccountCardDetails.expiry}</span>
                                            <span>CVV: {selectedAccountCardDetails.cvv}</span>
                                        </div>
                                        <p className="text-sm">PIN: {selectedAccountCardDetails.pin}</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button onClick={() => setShowAccountCardModal(false)} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                                Close
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
