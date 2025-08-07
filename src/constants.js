export const COLORS = {
    background: '#0D0D0D', // Dark background
    typography: '#E0E0E0', // Light gray text for readability
    primaryAccent: '#00FFAA', // Bright green for primary actions, highlights
    secondaryAccent: '#1A1A1A', // Slightly lighter dark for cards, headers
    buttonsGlow: 'rgba(0, 255, 170, 0.5)', // Glow effect for buttons
    success: '#4CAF50', // Green for success messages
    warning: '#FFC107', // Amber for warnings
    danger: '#F44336', // Red for errors/critical
    info: '#2196F3', // Blue for informational messages
};

export const MEMBERSHIP_PLANS = [
    {
        name: 'Restricted',
        minCreditScore: 0,
        maxCreditScore: 399,
        tierColor: '#F44336', // Red
        monthlyInterestRate: 0.05, // 5% monthly interest on loans
        lateFeeRate: 0.05, // 5% late fee on outstanding amount
        loanEligibility: {
            Personal: 1000,
            Business: 0,
            Mortgage: 0
        },
        baseCreditLimit: 500,
        creditLimitModifier: 0,
        feeDiscount: 0, // No discount
        savingsInterestRate: 0.005, // 0.5% annual interest for savings (will be overridden by global)
    },
    {
        name: 'Basic',
        minCreditScore: 400,
        maxCreditScore: 599,
        tierColor: '#FFC107', // Amber
        monthlyInterestRate: 0.03, // 3% monthly interest on loans
        lateFeeRate: 0.03, // 3% late fee on outstanding amount
        loanEligibility: {
            Personal: 5000,
            Business: 10000,
            Mortgage: 0
        },
        baseCreditLimit: 2000,
        creditLimitModifier: 0.1, // 10% increase
        feeDiscount: 0.05, // 5% discount on fees
        savingsInterestRate: 0.01, // 1% annual interest for savings (will be overridden by global)
    },
    {
        name: 'Standard',
        minCreditScore: 600,
        maxCreditScore: 749,
        tierColor: '#2196F3', // Blue
        monthlyInterestRate: 0.02, // 2% monthly interest on loans
        lateFeeRate: 0.02, // 2% late fee on outstanding amount
        loanEligibility: {
            Personal: 10000,
            Business: 50000,
            Mortgage: 100000
        },
        baseCreditLimit: 10000,
        creditLimitModifier: 0.2, // 20% increase
        feeDiscount: 0.1, // 10% discount on fees
        savingsInterestRate: 0.02, // 2% annual interest for savings (will be overridden by global)
    },
    {
        name: 'Premium',
        minCreditScore: 750,
        maxCreditScore: 899,
        tierColor: '#4CAF50', // Green
        monthlyInterestRate: 0.01, // 1% monthly interest on loans
        lateFeeRate: 0.01, // 1% late fee on outstanding amount
        loanEligibility: {
            Personal: 25000,
            Business: 100000,
            Mortgage: 500000
        },
        baseCreditLimit: 25000,
        creditLimitModifier: 0.3, // 30% increase
        feeDiscount: 0.15, // 15% discount on fees
        savingsInterestRate: 0.025, // 2.5% annual interest for savings (will be overridden by global)
    },
    {
        name: 'Shadow (VIP)',
        minCreditScore: 900,
        maxCreditScore: Infinity, // Unlimited
        tierColor: '#9C27B0', // Purple
        monthlyInterestRate: 0.005, // 0.5% monthly interest on loans
        lateFeeRate: 0.005, // 0.5% late fee on outstanding amount
        loanEligibility: {
            Personal: Infinity,
            Business: Infinity,
            Mortgage: Infinity
        },
        baseCreditLimit: Infinity,
        creditLimitModifier: 0.5, // 50% increase
        feeDiscount: 0.25, // 25% discount on fees
        savingsInterestRate: 0.03, // 3% annual interest for savings (will be overridden by global)
    },
];

export const PENALTY_RULES = {
    OVERUSED_CREDIT: {
        interestSpike: 0.02, // 2% increase in monthly interest rate
        creditScoreDecrease: [10, 20] // Range for credit score decrease
    },
    MISSED_PAYMENT: {
        creditScoreDing: {
            'Restricted': 20,
            'Basic': 15,
            'Standard': 10,
            'Premium': 5,
            'Shadow (VIP)': 2
        }
    },
    LOAN_DEFAULT: {
        interestIncrease: 0.05, // 5% increase in loan interest rate
        creditScorePenalty: [50, 100] // Range for credit score decrease
    }
};

export const getMembershipPlanByScore = (score) => {
    for (const plan of MEMBERSHIP_PLANS) {
        if (score >= plan.minCreditScore && score <= plan.maxCreditScore) {
            return plan;
        }
    }
    return MEMBERSHIP_PLANS[0]; // Default to Restricted if no plan matches
};

export const getMembershipPlanByName = (name) => {
    return MEMBERSHIP_PLANS.find(plan => plan.name === name) || MEMBERSHIP_PLANS[0];
};

// New Banking System Constants
export const BANK_CONSTANTS = {
    MIN_LIQUIDITY_THRESHOLD: 0.20, // 20%
    SAVINGS_ANNUAL_INTEREST_RATE: 0.03, // 3% annual interest rate for all savings accounts
    HOURS_IN_A_MONTH: 12, // System's definition of a month in hours
    INVESTMENT_ASSET_TYPES: [
        { name: 'Government Bonds', annualReturnRate: 0.06 }, // 6% annual return
        { name: 'Stocks', annualReturnRate: 0.10 }, // 10% annual return
        { name: 'Real Estate', annualReturnRate: 0.08 }, // 8% annual return
    ],
};

// Corrected REGION_CODES with your specified regions
export const REGION_CODES = [
    'Northern Frontier',
    'Volga Valley',
    'Caucasia',
    'Central Steppes',
    'Siberian Frontier',
    'Outer Mongolia'
];
