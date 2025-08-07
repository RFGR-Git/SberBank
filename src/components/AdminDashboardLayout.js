import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, runTransaction, getDoc, addDoc, where } from 'firebase/firestore';
import GlassCard from './common/GlassCard';
import MessagePopup from './common/MessagePopup';
import { COLORS, MEMBERSHIP_PLANS } from '../constants';
import { User, Briefcase, DollarSign, Ban, CheckCircle, XCircle, Search, LogOut, Trash2, Edit, PlusCircle, CreditCard, ShieldOff, Lock, Unlock, Gavel, UserCog } from 'lucide-react';

const AdminDashboardLayout = ({ userProfile, setUserProfile, db, appId, auth, setCurrentView, showMessage }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [accountRequests, setAccountRequests] = useState([]);
    const [depositRequests, setDepositRequests] = useState([]);
    const [withdrawalRequests, setWithdrawalRequests] = useState([]);
    const [transferRequests, setTransferRequests] = useState([]);
    const [loanRequests, setLoanRequests] = useState([]);
    const [creditCardRequests, setCreditCardRequests] = useState([]);
    const [activeRequestTab, setActiveRequestTab] = useState('accountCreation');

    const [showProfileDetails, setShowProfileDetails] = useState(false);

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


    const fetchUsers = useCallback(async () => {
        try {
            const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
            const q = query(usersCollectionRef);
            const querySnapshot = await getDocs(q);
            const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllUsers(usersList);
        } catch (error) {
            console.error("Error fetching users:", error);
            showMessage("Failed to fetch user data.", "error");
        }
    }, [db, appId, showMessage]);

    const fetchRequests = useCallback(async () => {
        try {
            const accountReqsSnap = await getDocs(collection(db, `artifacts/${appId}/public/data/accountCreationRequests`));
            setAccountRequests(accountReqsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const depositReqsSnap = await getDocs(collection(db, `artifacts/${appId}/public/data/depositRequests`));
            setDepositRequests(depositReqsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const withdrawalReqsSnap = await getDocs(collection(db, `artifacts/${appId}/public/data/withdrawalRequests`));
            setWithdrawalRequests(withdrawalReqsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const transferReqsSnap = await getDocs(collection(db, `artifacts/${appId}/public/data/transferRequests`));
            setTransferRequests(transferReqsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const loanReqsSnap = await getDocs(collection(db, `artifacts/${appId}/public/data/loanRequests`));
            setLoanRequests(loanReqsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const creditCardReqsSnap = await getDocs(collection(db, `artifacts/${appId}/public/data/creditCardRequests`));
            setCreditCardRequests(creditCardReqsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        } catch (error) {
            console.error("Error fetching requests:", error);
            showMessage("Failed to fetch requests data.", "error");
        }
    }, [db, appId, showMessage]);


    useEffect(() => {
        fetchUsers();
        fetchRequests();
    }, [fetchUsers, fetchRequests]);

    const handleEditUser = (user) => {
        setSelectedUser(user);
        const accountsForEdit = {};
        for (const key in user.accounts) {
            // Ensure we only process actual account objects, not metadata like CreditCardLimit
            if (user.accounts.hasOwnProperty(key) && typeof user.accounts[key] === 'object' && user.accounts[key] !== null && key !== 'CreditCardLimit') {
                accountsForEdit[key] = { ...user.accounts[key] };
            } else if (key !== 'CreditCardLimit') { // Handle cases where balance might be directly stored (older data)
                accountsForEdit[key] = { balance: user.accounts[key] || 0, accountNumber: '' };
            }
        }

        setEditForm({
            name: user.name,
            discordId: user.discordId,
            bankId: user.bankId,
            kycCode: user.kycCode,
            region: user.region,
            balance: user.balance,
            accounts: accountsForEdit,
            creditScore: user.creditScore,
            isFrozen: user.isFrozen,
            specialRole: user.specialRole,
            isBusinessOwner: user.isBusinessOwner,
            businessRegistrationId: user.businessRegistrationId,
            isLoanBlacklisted: user.isLoanBlacklisted,
            isCreditFrozen: user.isCreditFrozen,
            isCreditCardSuspended: user.isCreditCardSuspended,
            newLoanBlockedEndDate: user.newLoanBlockedEndDate,
            isSuspicious: user.isSuspicious,
            triggerInternalAffairs: user.triggerInternalAffairs,
            job: user.job,
            dob: user.dob,
            placeOfBirth: user.placeOfBirth,
            gender: user.gender,
            citizenshipStatus: user.citizenshipStatus,
            rpIdNumber: user.rpIdNumber,
            isVIP: user.isVIP,
            isAdmin: user.isAdmin,
            userTier: user.userTier,
            debitCard: user.debitCard,
            hasCreditCard: user.hasCreditCard, // Ensure this is carried over
            creditCardInterestRate: user.creditCardInterestRate, // Ensure this is carried over
        });
        setShowEditModal(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;

        const accountsToSave = {};
        for (const key in editForm.accounts) {
            if (editForm.accounts.hasOwnProperty(key)) {
                accountsToSave[key] = {
                    balance: parseFloat(editForm.accounts[key].balance) || 0,
                    accountNumber: editForm.accounts[key].accountNumber || ''
                };
            }
        }
        // Ensure CreditCardLimit is preserved if it exists and is not part of the iteration
        if (selectedUser.accounts?.CreditCardLimit !== undefined) {
             accountsToSave.CreditCardLimit = editForm.accounts?.CreditCardLimit === 'Infinity' ? Infinity : parseFloat(editForm.accounts?.CreditCardLimit) || 0;
        }


        try {
            const userDocRef = doc(db, `artifacts/${appId}/users`, selectedUser.id);
            await updateDoc(userDocRef, {
                ...editForm,
                balance: parseFloat(editForm.balance),
                creditScore: parseInt(editForm.creditScore),
                accounts: accountsToSave,
                debitCard: editForm.debitCard,
                // Ensure these are explicitly updated if they are part of the form
                hasCreditCard: editForm.hasCreditCard,
                creditCardInterestRate: parseFloat(editForm.creditCardInterestRate) || 0,
            });
            showMessage("User updated successfully!", "success");
            setShowEditModal(false);
            fetchUsers();
        } catch (error) {
            console.error("Error saving user:", error);
            showMessage(`Failed to save user: ${error.message}`, "error");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users`, userId));
                showMessage("User deleted successfully!", "success");
                fetchUsers();
            } catch (error) {
                console.error("Error deleting user:", error);
                showMessage(`Failed to delete user: ${error.message}`, "error");
            }
        }
    };

    const handleAccountBalanceChange = (accountType, field, value) => {
        setEditForm(prev => ({
            ...prev,
            accounts: {
                ...prev.accounts,
                [accountType]: {
                    ...prev.accounts[accountType],
                    [field]: field === 'balance' ? (parseFloat(value) || 0) : value
                }
            }
        }));
    };

    const handleAddAccountField = () => {
        const newAccountName = prompt("Enter new account type name (e.g., 'Crypto', 'Stocks'):");
        if (newAccountName && !editForm.accounts.hasOwnProperty(newAccountName)) {
            const generateAccountNumber = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();

            setEditForm(prev => ({
                ...prev,
                accounts: {
                    ...prev.accounts,
                    [newAccountName]: { balance: 0.00, accountNumber: generateAccountNumber() }
                }
            }));
        } else if (newAccountName) {
            showMessage("Account type already exists or name is invalid.", "warning");
        }
    };

    const handleRemoveAccountField = (accountTypeToRemove) => {
        if (window.confirm(`Are you sure you want to remove the ${accountTypeToRemove} account? This will set its balance to 0.`)) {
            setEditForm(prev => {
                const updatedAccounts = { ...prev.accounts };
                delete updatedAccounts[accountTypeToRemove];
                return {
                    ...prev,
                    accounts: updatedAccounts
                };
            });
            showMessage(`${accountTypeToRemove} account removed.`, "info");
        }
    };


    const handleApproveAccount = async (request) => {
        try {
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, `artifacts/${appId}/users`, request.userId);
                const userSnap = await transaction.get(userDocRef);

                if (!userSnap.exists()) {
                    throw new Error("User does not exist!");
                }
                const userData = userSnap.data();

                const currentAccounts = userData.accounts || {};
                const newAccounts = {
                    ...currentAccounts,
                    [request.accountType]: {
                        balance: (currentAccounts[request.accountType]?.balance ?? 0) + request.initialDeposit,
                        accountNumber: request.accountNumber
                    }
                };
                const newBalance = (userData.balance || 0) + request.initialDeposit;

                transaction.update(userDocRef, {
                    accounts: newAccounts,
                    balance: newBalance
                });

                const requestDocRef = doc(db, `artifacts/${appId}/public/data/accountCreationRequests`, request.id);
                transaction.delete(requestDocRef);
            });
            showMessage(`Approved account creation for ${request.userName}'s ${request.accountType} account.`, "success");
            fetchUsers();
            fetchRequests();
        } catch (error) {
            console.error("Error approving account:", error);
            showMessage(`Failed to approve account: ${error.message}`, "error");
        }
    };

    const handleDenyRequest = async (collectionName, requestId) => {
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/${collectionName}`, requestId));
            showMessage("Request denied and removed.", "info");
            fetchRequests();
        } catch (error) {
            console.error("Error denying request:", error);
            showMessage(`Failed to deny request: ${error.message}`, "error");
        }
    };

    const handleApproveDeposit = async (request) => {
        try {
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, `artifacts/${appId}/users`, request.userId);
                const userSnap = await transaction.get(userDocRef);
                if (!userSnap.exists()) throw new Error("User not found.");
                const userData = userSnap.data();

                const newAccountBalance = (userData.accounts[request.accountType]?.balance ?? 0) + request.netDeposit;
                const newOverallBalance = (userData.balance || 0) + request.netDeposit;

                const newTransactions = [...(userData.transactions || []), {
                    date: new Date().toLocaleDateString('en-US'),
                    description: `Deposit to ${request.accountType} (via Discord: ${request.discordLink})`,
                    amount: request.netDeposit,
                    status: 'Completed'
                }];

                transaction.update(userDocRef, {
                    [`accounts.${request.accountType}.balance`]: newAccountBalance,
                    balance: newOverallBalance,
                    transactions: newTransactions
                });

                const requestDocRef = doc(db, `artifacts/${appId}/public/data/depositRequests`, request.id);
                transaction.delete(requestDocRef);
            });
            showMessage(`Approved deposit for ${request.userName} to ${request.accountType}.`, "success");
            fetchUsers();
            fetchRequests();
        } catch (error) {
            console.error("Error approving deposit:", error);
            showMessage(`Failed to approve deposit: ${error.message}`, "error");
        }
    };

    const handleApproveWithdrawal = async (request) => {
        try {
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, `artifacts/${appId}/users`, request.userId);
                const userSnap = await transaction.get(userDocRef);
                if (!userSnap.exists()) throw new Error("User not found.");
                const userData = userSnap.data();

                const currentAccountBalance = userData.accounts[request.sourceAccount]?.balance ?? 0;
                if (currentAccountBalance < request.totalAmountDeducted) {
                    throw new Error("Insufficient funds for withdrawal.");
                }

                const newAccountBalance = currentAccountBalance - request.totalAmountDeducted;
                const newOverallBalance = (userData.balance || 0) - request.totalAmountDeducted;

                const newTransactions = [...(userData.transactions || []), {
                    date: new Date().toLocaleDateString('en-US'),
                    description: `Withdrawal from ${request.sourceAccount}`,
                    amount: -request.totalAmountDeducted,
                    status: 'Completed'
                }];

                transaction.update(userDocRef, {
                    [`accounts.${request.sourceAccount}.balance`]: newAccountBalance,
                    balance: newOverallBalance,
                    transactions: newTransactions
                });

                const requestDocRef = doc(db, `artifacts/${appId}/public/data/withdrawalRequests`, request.id);
                transaction.delete(requestDocRef);
            });
            showMessage(`Approved withdrawal for ${request.userName} from ${request.sourceAccount}.`, "success");
            fetchUsers();
            fetchRequests();
        } catch (error) {
            console.error("Error approving withdrawal:", error);
            showMessage(`Failed to approve withdrawal: ${error.message}`, "error");
        }
    };

    const handleApproveTransfer = async (request) => {
        try {
            await runTransaction(db, async (transaction) => {
                const senderDocRef = doc(db, `artifacts/${appId}/users`, request.userId);
                const senderSnap = await transaction.get(senderDocRef);
                if (!senderSnap.exists()) throw new Error("Sender user not found.");
                const senderData = senderSnap.data();

                const senderFromAccountBalance = senderData.accounts[request.fromAccount]?.balance ?? 0;
                if (senderFromAccountBalance < request.amount) {
                    throw new Error("Insufficient funds in sender's account.");
                }

                const usersRef = collection(db, `artifacts/${appId}/users`);
                const qRecipient = query(usersRef, where("discordId", "==", request.recipientUserId));
                const recipientSnapshot = await getDocs(qRecipient);

                if (recipientSnapshot.empty) {
                    throw new Error(`Recipient with User ID ${request.recipientUserId} not found.`);
                }
                const recipientDoc = recipientSnapshot.docs[0];
                const recipientDocRef = doc(db, `artifacts/${appId}/users`, recipientDoc.id);
                const recipientSnap = await transaction.get(recipientDocRef);
                const recipientData = recipientSnap.data();

                let recipientAccountType = null;
                for (const accType in recipientData.accounts) {
                    if (recipientData.accounts[accType].accountNumber === request.recipientAccountNumber) {
                        recipientAccountType = accType;
                        break;
                    }
                }

                if (!recipientAccountType) {
                    throw new Error(`Recipient account with number ${request.recipientAccountNumber} not found for user ${request.recipientUserId}.`);
                }

                const newSenderAccountBalance = senderFromAccountBalance - request.amount;
                const newSenderOverallBalance = (senderData.balance || 0) - request.amount;
                const newSenderTransactions = [...(senderData.transactions || []), {
                    date: new Date().toLocaleDateString('en-US'),
                    description: `Transfer to ${request.recipientUserId}'s ${recipientAccountType} (Account No: ${request.recipientAccountNumber})`,
                    amount: -request.amount,
                    status: 'Completed'
                }];
                transaction.update(senderDocRef, {
                    [`accounts.${request.fromAccount}.balance`]: newSenderAccountBalance,
                    balance: newSenderOverallBalance,
                    transactions: newSenderTransactions
                });

                const newRecipientAccountBalance = (recipientData.accounts[recipientAccountType]?.balance ?? 0) + request.amount;
                const newRecipientOverallBalance = (recipientData.balance || 0) + request.amount;
                const newRecipientTransactions = [...(recipientData.transactions || []), {
                    date: new Date().toLocaleDateString('en-US'),
                    description: `Transfer from ${senderData.discordId}'s ${request.fromAccount}`,
                    amount: request.amount,
                    status: 'Completed'
                }];
                transaction.update(recipientDocRef, {
                    [`accounts.${recipientAccountType}.balance`]: newRecipientAccountBalance,
                    balance: newRecipientOverallBalance,
                    transactions: newRecipientTransactions
                });

                const requestDocRef = doc(db, `artifacts/${appId}/public/data/transferRequests`, request.id);
                transaction.delete(requestDocRef);
            });
            showMessage(`Approved transfer from ${request.userName} to ${request.recipientUserId}'s account.`, "success");
            fetchUsers();
            fetchRequests();
        } catch (error) {
            console.error("Error approving transfer:", error);
            showMessage(`Failed to approve transfer: ${error.message}`, "error");
        }
    };

    const handleApproveLoan = async (request) => {
        try {
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, `artifacts/${appId}/users`, request.userId);
                const userSnap = await transaction.get(userDocRef);
                if (!userSnap.exists()) throw new Error("User not found.");
                const userData = userSnap.data();

                const newLoan = {
                    loanId: doc(collection(db, "temp")).id,
                    type: request.loanType,
                    amount: request.amount,
                    repaymentPeriod: request.repaymentPeriod,
                    interestRate: request.interestRate,
                    collateralLink: request.collateralLink,
                    downPayment: request.downPayment,
                    propertyRegion: request.propertyRegion,
                    status: 'Active',
                    startDate: new Date().toISOString(),
                    lastPaymentDate: new Date().toISOString(),
                    paidAmount: 0,
                    totalInterestAccrued: 0,
                    missedPayments: 0,
                    nextDueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
                };
                const updatedLoanHistory = [...(userData.loanHistory || []), newLoan];

                const targetAccount = 'Personal'; // Loans are deposited to Personal/Checking account
                const newAccountBalance = (userData.accounts[targetAccount]?.balance ?? 0) + request.amount;
                const newOverallBalance = (userData.balance || 0) + request.amount;

                const newTransactions = [...(userData.transactions || []), {
                    date: new Date().toLocaleDateString('en-US'),
                    description: `Loan received (${request.loanType})`,
                    amount: request.amount,
                    status: 'Completed'
                }];

                transaction.update(userDocRef, {
                    loanHistory: updatedLoanHistory,
                    [`accounts.${targetAccount}.balance`]: newAccountBalance,
                    balance: newOverallBalance,
                    transactions: newTransactions
                });

                const requestDocRef = doc(db, `artifacts/${appId}/public/data/loanRequests`, request.id);
                transaction.delete(requestDocRef);
            });
            showMessage(`Approved loan for ${request.userName} (${request.loanType}).`, "success");
            fetchUsers();
            fetchRequests();
        } catch (error) {
            console.error("Error approving loan:", error);
            showMessage(`Failed to approve loan: ${error.message}`, "error");
        }
    };

    const handleApproveCreditCard = async (request) => {
        try {
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, `artifacts/${appId}/users`, request.userId);
                const userSnap = await transaction.get(userDocRef);
                if (!userSnap.exists()) throw new Error("User not found.");
                const userData = userSnap.data();

                const generateSegment = () => Math.floor(1000 + Math.random() * 9000).toString();
                const cardNumber = `4242 ${generateSegment()} ${generateSegment()} ${generateSegment()}`;
                const currentYear = new Date().getFullYear();
                const expiryYear = currentYear + 4;
                const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                const expiryDate = new Date(expiryYear, parseInt(expiryMonth) - 1, 1);
                const expiry = `${expiryMonth}/${String(expiryYear).slice(-2)}`;
                const cvv = Math.floor(100 + Math.random() * 900).toString();
                const pin = Math.floor(1000 + Math.random() * 9000).toString();

                const generateAccountNumber = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();

                const newDebitCard = {
                    number: cardNumber,
                    expiry: expiry,
                    expiryDate: expiryDate.toISOString(),
                    cvv: cvv,
                    pin: pin,
                    type: 'Credit' // This is the primary debitCard for the user, now representing the Credit Card
                };

                const newAccounts = {
                    ...userData.accounts,
                    CreditCard: { balance: 0.00, accountNumber: generateAccountNumber() }, // The actual CreditCard account
                    CreditCardLimit: request.creditLimit // The limit stored separately
                };

                transaction.update(userDocRef, {
                    hasCreditCard: true,
                    debitCard: newDebitCard, // Update the primary debitCard to be the new credit card
                    accounts: newAccounts,
                    creditCardInterestRate: request.interestRate,
                    lastCreditCardPaymentDate: new Date().toISOString(),
                    missedCreditCardPayments: 0
                });

                const requestDocRef = doc(db, `artifacts/${appId}/public/data/creditCardRequests`, request.id);
                transaction.delete(requestDocRef);
            });
            showMessage(`Approved credit card for ${request.userName} with limit ₽${request.creditLimit === Infinity ? 'Unlimited' : request.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`, "success");
            fetchUsers();
            fetchRequests();
        } catch (error) {
            console.error("Error approving credit card:", error);
            showMessage(`Failed to approve credit card: ${error.message}`, "error");
        }
    };


    const filteredUsers = allUsers.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.discordId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.bankId?.includes(searchTerm) ||
        user.kycCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    return (
        <div className="min-h-screen flex flex-col items-center p-8" style={{ backgroundColor: COLORS.background, color: COLORS.typography }}>
            {/* Top Navigation Bar */}
            <header className="w-full max-w-6xl p-4 flex justify-between items-center shadow-md rounded-lg mb-8" style={{ backgroundColor: COLORS.secondaryAccent }}>
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold" style={{ color: COLORS.primaryAccent }}>Sberbank Admin</h1>
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

            {/* Admin Dashboard Content */}
            <main className="w-full max-w-6xl">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <GlassCard className="p-6 text-center">
                        <User size={48} style={{ color: COLORS.primaryAccent }} className="mb-3 mx-auto" />
                        <h3 className="text-xl font-semibold mb-1" style={{ color: COLORS.typography }}>Total Users</h3>
                        <p className="text-4xl font-bold" style={{ color: COLORS.primaryAccent }}>{allUsers.length}</p>
                    </GlassCard>
                    <GlassCard className="p-6 text-center">
                        <DollarSign size={48} style={{ color: COLORS.primaryAccent }} className="mb-3 mx-auto" />
                        <h3 className="text-xl font-semibold mb-1" style={{ color: COLORS.typography }}>Total Bank Funds</h3>
                        <p className="text-4xl font-bold" style={{ color: COLORS.primaryAccent }}>
                            ₽{allUsers.reduce((sum, user) => sum + (user.balance || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </GlassCard>
                    <GlassCard className="p-6 text-center cursor-pointer" onClick={() => setShowRequestsModal(true)}>
                        <Briefcase size={48} style={{ color: COLORS.primaryAccent }} className="mb-3 mx-auto" />
                        <h3 className="text-xl font-semibold mb-1" style={{ color: COLORS.typography }}>Pending Requests</h3>
                        <p className="text-4xl font-bold" style={{ color: COLORS.primaryAccent }}>
                            {accountRequests.length + depositRequests.length + withdrawalRequests.length + transferRequests.length + loanRequests.length + creditCardRequests.length}
                        </p>
                    </GlassCard>
                </div>

                {/* User Management Section */}
                <section className="mb-8">
                    <h2 className="text-3xl font-bold mb-6" style={{ color: COLORS.primaryAccent }}>User Management</h2>
                    <GlassCard className="p-6">
                        <div className="mb-4 flex justify-between items-center">
                            <input
                                type="text"
                                placeholder="Search by name, Discord ID, Bank ID, KYC Code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead style={{ color: COLORS.primaryAccent }}>
                                    <tr>
                                        <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Name</th>
                                        <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">User ID</th>
                                        <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Bank ID</th>
                                        <th className="py-3 px-4 text-right text-sm font-semibold uppercase tracking-wider">Balance</th>
                                        <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Role</th>
                                        <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Membership Level</th>
                                        <th className="py-3 px-4 text-center text-sm font-semibold uppercase tracking-wider">Frozen</th>
                                        <th className="py-3 px-4 text-center text-sm font-semibold uppercase tracking-wider">Blacklisted</th>
                                        <th className="py-3 px-4 text-center text-sm font-semibold uppercase tracking-wider">Suspicious</th>
                                        <th className="py-3 px-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-white hover:bg-opacity-10 transition-colors duration-200">
                                            <td className="py-3 px-4">{user.name}</td>
                                            <td className="py-3 px-4">{user.discordId}</td>
                                            <td className="py-3 px-4">{user.bankId}</td>
                                            <td className="py-3 px-4 text-right">₽{(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="py-3 px-4">{user.specialRole}</td>
                                            <td className="py-3 px-4">{user.userTier || 'N/A'}</td>
                                            <td className="py-3 px-4 text-center">
                                                {user.isFrozen ? <CheckCircle size={20} className="text-red-500 inline" /> : <XCircle size={20} className="text-green-500 inline" />}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {user.isLoanBlacklisted ? <CheckCircle size={20} className="text-red-500 inline" /> : <XCircle size={20} className="text-green-500 inline" />}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {user.isSuspicious ? <CheckCircle size={20} className="text-orange-500 inline" /> : <XCircle size={20} className="text-green-500 inline" />}
                                            </td>
                                            <td className="py-3 px-4 text-center space-x-2">
                                                <button onClick={() => handleEditUser(user)} className="text-blue-400 hover:text-blue-600">
                                                    <Edit size={20} />
                                                </button>
                                                <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </section>
            </main>

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-3xl font-bold mb-6 text-center" style={{ color: COLORS.primaryAccent }}>Edit User: {selectedUser.name}</h3>
                        <form onSubmit={handleSaveUser} className="space-y-4">
                            {/* Basic Info */}
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Name</label>
                                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>User ID (Discord ID)</label>
                                <input type="text" value={editForm.discordId} onChange={(e) => setEditForm({ ...editForm, discordId: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Bank ID</label>
                                <input type="text" value={editForm.bankId} onChange={(e) => setEditForm({ ...editForm, bankId: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>KYC Code</label>
                                <input type="text" value={editForm.kycCode} onChange={(e) => setEditForm({ ...editForm, kycCode: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Region</label>
                                <input type="text" value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Job/Occupation</label>
                                <input type="text" value={editForm.job} onChange={(e) => setEditForm({ ...editForm, job: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Date of Birth</label>
                                <input type="text" value={editForm.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                                    placeholder="MM/DD/YYYY"
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Place of Birth</label>
                                <input type="text" value={editForm.placeOfBirth} onChange={(e) => setEditForm({ ...editForm, placeOfBirth: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Gender</label>
                                <input type="text" value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Citizenship Status</label>
                                <input type="text" value={editForm.citizenshipStatus} onChange={(e) => setEditForm({ ...editForm, citizenshipStatus: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>RP ID Number</label>
                                <input type="text" value={editForm.rpIdNumber} onChange={(e) => setEditForm({ ...editForm, rpIdNumber: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>

                            {/* Financial Info */}
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Overall Balance</label>
                                <input type="number" step="0.01" value={editForm.balance} onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Credit Score</label>
                                <input type="number" value={editForm.creditScore} onChange={(e) => setEditForm({ ...editForm, creditScore: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                            </div>

                            {/* Accounts Section */}
                            <h4 className="text-xl font-bold mt-6" style={{ color: COLORS.primaryAccent }}>Accounts</h4>
                            {Object.keys(editForm.accounts || {}).map(accountType => (
                                <div key={accountType} className="flex flex-wrap items-center space-x-2 mb-2">
                                    <label className="block text-md font-medium w-1/4" style={{ color: COLORS.typography }}>
                                        {accountType === 'Personal' ? 'Checking' : accountType} {/* Display "Checking" */}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.accounts[accountType]?.balance ?? ''}
                                        onChange={(e) => handleAccountBalanceChange(accountType, 'balance', e.target.value)}
                                        placeholder="Balance"
                                        className="w-1/3 p-2 border border-gray-600 rounded-lg"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                    />
                                    <input
                                        type="text"
                                        value={editForm.accounts[accountType]?.accountNumber ?? ''}
                                        onChange={(e) => handleAccountBalanceChange(accountType, 'accountNumber', e.target.value)}
                                        placeholder="Account No."
                                        className="w-1/4 p-2 border border-gray-600 rounded-lg"
                                        style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}
                                        readOnly
                                    />
                                    {accountType !== 'Personal' && ( // Don't allow removing Personal/Checking account
                                        <button type="button" onClick={() => handleRemoveAccountField(accountType)} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={handleAddAccountField} className="mt-2 px-4 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200">
                                <PlusCircle size={20} className="inline mr-2" /> Add New Account Type
                            </button>

                            {/* Debit Card Details */}
                            <h4 className="text-xl font-bold mt-6" style={{ color: COLORS.primaryAccent }}>Debit Card Details</h4>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Card Type</label>
                                <select value={editForm.debitCard?.type || ''} onChange={(e) => setEditForm(prev => ({ ...prev, debitCard: { ...prev.debitCard, type: e.target.value } }))}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}>
                                    <option value="Debit">Debit</option>
                                    <option value="Credit">Credit</option>
                                    {/* Add other card types if needed, e.g., BusinessDebit */}
                                </select>
                            </div>
                            {editForm.debitCard?.type === 'Credit' && (
                                <>
                                    <div>
                                        <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Credit Card Limit</label>
                                        <input type="number" step="0.01" value={editForm.accounts?.CreditCardLimit === Infinity ? 'Infinity' : editForm.accounts?.CreditCardLimit}
                                            onChange={(e) => setEditForm(prev => ({
                                                ...prev,
                                                accounts: {
                                                    ...prev.accounts,
                                                    CreditCardLimit: e.target.value === 'Infinity' ? Infinity : parseFloat(e.target.value) || 0
                                                }
                                            }))}
                                            className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                                    </div>
                                    <div>
                                        <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Credit Card Interest Rate (Monthly)</label>
                                        <input type="number" step="0.0001" value={editForm.creditCardInterestRate}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, creditCardInterestRate: parseFloat(e.target.value) || 0 }))}
                                            className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Card Number</label>
                                <input type="text" value={editForm.debitCard?.number || ''} readOnly
                                    className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800" style={{ color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Expiry</label>
                                <input type="text" value={editForm.debitCard?.expiry || ''} readOnly
                                    className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800" style={{ color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>CVV</label>
                                <input type="text" value={editForm.debitCard?.cvv || ''} readOnly
                                    className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800" style={{ color: COLORS.typography }} />
                            </div>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>PIN</label>
                                <input type="text" value={editForm.debitCard?.pin || ''} readOnly
                                    className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800" style={{ color: COLORS.typography }} />
                            </div>


                            {/* Status Flags */}
                            <h4 className="text-xl font-bold mt-6" style={{ color: COLORS.primaryAccent }}>Status Flags</h4>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="isFrozen" checked={editForm.isFrozen} onChange={(e) => setEditForm({ ...editForm, isFrozen: e.target.checked })}
                                    className="h-5 w-5 text-green-600 rounded" style={{ backgroundColor: COLORS.secondaryAccent }} />
                                <label htmlFor="isFrozen" className="text-lg" style={{ color: COLORS.typography }}>Account Frozen</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="isLoanBlacklisted" checked={editForm.isLoanBlacklisted} onChange={(e) => setEditForm({ ...editForm, isLoanBlacklisted: e.target.checked })}
                                    className="h-5 w-5 text-green-600 rounded" style={{ backgroundColor: COLORS.secondaryAccent }} />
                                <label htmlFor="isLoanBlacklisted" className="text-lg" style={{ color: COLORS.typography }}>Loan Blacklisted</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="isCreditFrozen" checked={editForm.isCreditFrozen} onChange={(e) => setEditForm({ ...editForm, isCreditFrozen: e.target.checked })}
                                    className="h-5 w-5 text-green-600 rounded" style={{ backgroundColor: COLORS.secondaryAccent }} />
                                <label htmlFor="isCreditFrozen" className="text-lg" style={{ color: COLORS.typography }}>Credit Frozen</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="isCreditCardSuspended" checked={editForm.isCreditCardSuspended} onChange={(e) => setEditForm({ ...editForm, isCreditCardSuspended: e.target.checked })}
                                    className="h-5 w-5 text-green-600 rounded" style={{ backgroundColor: COLORS.secondaryAccent }} />
                                <label htmlFor="isCreditCardSuspended" className="text-lg" style={{ color: COLORS.typography }}>Credit Card Suspended</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="isSuspicious" checked={editForm.isSuspicious} onChange={(e) => setEditForm({ ...editForm, isSuspicious: e.target.checked })}
                                    className="h-5 w-5 text-green-600 rounded" style={{ backgroundColor: COLORS.secondaryAccent }} />
                                <label htmlFor="isSuspicious" className="text-lg" style={{ color: COLORS.typography }}>Mark as Suspicious</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="triggerInternalAffairs" checked={editForm.triggerInternalAffairs} onChange={(e) => setEditForm({ ...editForm, triggerInternalAffairs: e.target.checked })}
                                    className="h-5 w-5 text-green-600 rounded" style={{ backgroundColor: COLORS.secondaryAccent }} />
                                <label htmlFor="triggerInternalAffairs" className="text-lg" style={{ color: COLORS.typography }}>Trigger Internal Affairs</label>
                            </div>

                            {/* Roles and Tiers */}
                            <h4 className="text-xl font-bold mt-6" style={{ color: COLORS.primaryAccent }}>Roles & Membership Level</h4>
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Special Role</label>
                                <select value={editForm.specialRole} onChange={(e) => setEditForm({ ...editForm, specialRole: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}>
                                    <option value="User">User</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Super Admin">Super Admin</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="isBusinessOwner" checked={editForm.isBusinessOwner} onChange={(e) => setEditForm({ ...editForm, isBusinessOwner: e.target.checked })}
                                    className="h-5 w-5 text-green-600 rounded" style={{ backgroundColor: COLORS.secondaryAccent }} />
                                <label htmlFor="isBusinessOwner" className="text-lg" style={{ color: COLORS.typography }}>Business Owner</label>
                            </div>
                            {editForm.isBusinessOwner && (
                                <div>
                                    <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Business Registration ID</label>
                                    <input type="text" value={editForm.businessRegistrationId || ''} onChange={(e) => setEditForm({ ...editForm, businessRegistrationId: e.target.value })}
                                        className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }} />
                                </div>
                            )}
                            <div>
                                <label className="block text-lg font-medium mb-2" style={{ color: COLORS.typography }}>Membership Level</label>
                                <select value={editForm.userTier} onChange={(e) => setEditForm({ ...editForm, userTier: e.target.value })}
                                    className="w-full p-3 border border-gray-600 rounded-lg" style={{ backgroundColor: COLORS.secondaryAccent, color: COLORS.typography }}>
                                    {MEMBERSHIP_PLANS.map(plan => (
                                        <option key={plan.name} value={plan.name}>{plan.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-6 py-2 rounded-lg font-bold bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* Requests Modal */}
            {showRequestsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-3xl font-bold mb-6 text-center" style={{ color: COLORS.primaryAccent }}>Pending Requests</h3>

                        <div className="flex justify-center space-x-4 mb-6">
                            <button onClick={() => setActiveRequestTab('accountCreation')} className={`px-4 py-2 rounded-md font-medium ${activeRequestTab === 'accountCreation' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>Account Creation ({accountRequests.length})</button>
                            <button onClick={() => setActiveRequestTab('deposit')} className={`px-4 py-2 rounded-md font-medium ${activeRequestTab === 'deposit' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>Deposits ({depositRequests.length})</button>
                            <button onClick={() => setActiveRequestTab('withdrawal')} className={`px-4 py-2 rounded-md font-medium ${activeRequestTab === 'withdrawal' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>Withdrawals ({withdrawalRequests.length})</button>
                            <button onClick={() => setActiveRequestTab('transfer')} className={`px-4 py-2 rounded-md font-medium ${activeRequestTab === 'transfer' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>Transfers ({transferRequests.length})</button>
                            <button onClick={() => setActiveRequestTab('loan')} className={`px-4 py-2 rounded-md font-medium ${activeRequestTab === 'loan' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>Loans ({loanRequests.length})</button>
                            <button onClick={() => setActiveRequestTab('creditCard')} className={`px-4 py-2 rounded-md font-medium ${activeRequestTab === 'creditCard' ? 'bg-green-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>Credit Cards ({creditCardRequests.length})</button>
                        </div>

                        {activeRequestTab === 'accountCreation' && (
                            <div className="space-y-4">
                                {accountRequests.length > 0 ? (
                                    accountRequests.map(request => (
                                        <GlassCard key={request.id} className="p-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                                            <div>
                                                <p className="font-semibold">{request.userName} ({request.discordId})</p>
                                                <p className="text-sm text-gray-400">Requests to open {request.accountType} with ₽{request.initialDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                <p className="text-sm text-gray-400">Account No: {request.accountNumber}</p>
                                                {request.businessRegId && <p className="text-sm text-gray-400">Business ID: {request.businessRegId}</p>}
                                                {request.ministryName && <p className="text-sm text-gray-400">Ministry: {request.ministryName}</p>}
                                                <p className="text-sm text-gray-400">Proof: <a href={request.proofOfFundsLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Link</a></p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleApproveAccount(request)} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200">Approve</button>
                                                <button onClick={() => handleDenyRequest('accountCreationRequests', request.id)} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200">Deny</button>
                                            </div>
                                        </GlassCard>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-400">No pending account creation requests.</p>
                                )}
                            </div>
                        )}

                        {activeRequestTab === 'deposit' && (
                            <div className="space-y-4">
                                {depositRequests.length > 0 ? (
                                    depositRequests.map(request => (
                                        <GlassCard key={request.id} className="p-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                                            <div>
                                                <p className="font-semibold">{request.userName} ({request.discordId})</p>
                                                <p className="text-sm text-gray-400">Requests deposit of ₽{request.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to {request.accountType} (Fee: ₽{request.fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</p>
                                                <p className="text-sm text-gray-400">Net Deposit: ₽{request.netDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                <p className="text-sm text-gray-400">Proof: <a href={request.discordLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Link</a></p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleApproveDeposit(request)} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200">Approve</button>
                                                <button onClick={() => handleDenyRequest('depositRequests', request.id)} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200">Deny</button>
                                            </div>
                                        </GlassCard>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-400">No pending deposit requests.</p>
                                )}
                            </div>
                        )}

                        {activeRequestTab === 'withdrawal' && (
                            <div className="space-y-4">
                                {withdrawalRequests.length > 0 ? (
                                    withdrawalRequests.map(request => (
                                        <GlassCard key={request.id} className="p-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                                            <div>
                                                <p className="font-semibold">{request.userName} ({request.discordId})</p>
                                                <p className="text-sm text-gray-400">Requests withdrawal of ₽{request.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from {request.sourceAccount} (Fee: ₽{request.fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</p>
                                                <p className="text-sm text-gray-400">Total Deducted: ₽{request.totalAmountDeducted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleApproveWithdrawal(request)} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200">Approve</button>
                                                <button onClick={() => handleDenyRequest('withdrawalRequests', request.id)} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200">Deny</button>
                                            </div>
                                        </GlassCard>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-400">No pending withdrawal requests.</p>
                                )}
                            </div>
                        )}

                        {activeRequestTab === 'transfer' && (
                            <div className="space-y-4">
                                {transferRequests.length > 0 ? (
                                    transferRequests.map(request => (
                                        <GlassCard key={request.id} className="p-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                                            <div>
                                                <p className="font-semibold">{request.userName} ({request.discordId})</p>
                                                <p className="text-sm text-gray-400">Requests transfer of ₽{request.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from {request.fromAccount} to {request.recipientUserId}'s account (Account No: {request.recipientAccountNumber})</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleApproveTransfer(request)} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200">Approve</button>
                                                <button onClick={() => handleDenyRequest('transferRequests', request.id)} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200">Deny</button>
                                            </div>
                                        </GlassCard>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-400">No pending transfer requests.</p>
                                )}
                            </div>
                        )}

                        {activeRequestTab === 'loan' && (
                            <div className="space-y-4">
                                {loanRequests.length > 0 ? (
                                    loanRequests.map(request => (
                                        <GlassCard key={request.id} className="p-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                                            <div>
                                                <p className="font-semibold">{request.userName} ({request.discordId})</p>
                                                <p className="text-sm text-gray-400">Requests {request.loanType} loan of ₽{request.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} at {(request.interestRate * 100).toFixed(2)}% over {request.repaymentPeriod} months</p>
                                                {request.collateralLink && <p className="text-sm text-gray-400">Collateral: <a href={request.collateralLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Link</a></p>}
                                                {request.downPayment && <p className="text-sm text-gray-400">Down Payment: ₽{request.downPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>}
                                                {request.propertyRegion && <p className="text-sm text-gray-400">Property Region: {request.propertyRegion}</p>}
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleApproveLoan(request)} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200">Approve</button>
                                                <button onClick={() => handleDenyRequest('loanRequests', request.id)} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200">Deny</button>
                                            </div>
                                        </GlassCard>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-400">No pending loan requests.</p>
                                )}
                            </div>
                        )}

                        {activeRequestTab === 'creditCard' && (
                            <div className="space-y-4">
                                {creditCardRequests.length > 0 ? (
                                    creditCardRequests.map(request => (
                                        <GlassCard key={request.id} className="p-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                                            <div>
                                                <p className="font-semibold">{request.userName} ({request.discordId})</p>
                                                <p className="text-sm text-gray-400">Requests Credit Card (Score: {request.creditScore})</p>
                                                <p className="text-sm text-gray-400">Proposed Limit: ₽{request.creditLimit === Infinity ? 'Unlimited' : request.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                <p className="text-sm text-gray-400">Proposed Interest: {(request.interestRate * 100).toFixed(2)}%</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleApproveCreditCard(request)} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200">Approve</button>
                                                <button onClick={() => handleDenyRequest('creditCardRequests', request.id)} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200">Deny</button>
                                            </div>
                                        </GlassCard>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-400">No pending credit card requests.</p>
                                )}
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button onClick={() => setShowRequestsModal(false)} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                                Close
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardLayout;
