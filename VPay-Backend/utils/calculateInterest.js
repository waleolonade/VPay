/**
 * Calculate simple interest
 * @param {number} principal
 * @param {number} rate - annual rate as decimal (e.g. 0.08)
 * @param {number} timeDays - duration in days
 */
const calculateSimpleInterest = (principal, rate, timeDays) => {
  const timeYears = timeDays / 365;
  return parseFloat((principal * rate * timeYears).toFixed(2));
};

/**
 * Calculate compound interest
 * @param {number} principal
 * @param {number} rate - annual rate as decimal
 * @param {number} timeDays
 * @param {number} n - compounding frequency per year (default: 12 monthly)
 */
const calculateCompoundInterest = (principal, rate, timeDays, n = 12) => {
  const timeYears = timeDays / 365;
  const amount = principal * Math.pow(1 + rate / n, n * timeYears);
  return parseFloat((amount - principal).toFixed(2));
};

/**
 * Calculate total loan repayment with monthly reducing balance
 * @param {number} principal
 * @param {number} annualRate - decimal
 * @param {number} months
 */
const calculateLoanRepayment = (principal, annualRate, months) => {
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return principal / months;
  const monthlyPayment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return parseFloat(monthlyPayment.toFixed(2));
};

/**
 * Build a loan repayment schedule
 */
const buildRepaymentSchedule = (principal, annualRate, months) => {
  const monthlyPayment = calculateLoanRepayment(principal, annualRate, months);
  const monthlyRate = annualRate / 12;
  const schedule = [];
  let balance = principal;

  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const principalPaid = monthlyPayment - interest;
    balance -= principalPaid;
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);
    schedule.push({
      month: i,
      dueDate,
      amount: parseFloat(monthlyPayment.toFixed(2)),
      principal: parseFloat(principalPaid.toFixed(2)),
      interest: parseFloat(interest.toFixed(2)),
      balance: parseFloat(Math.max(balance, 0).toFixed(2)),
      isPaid: false,
    });
  }
  return schedule;
};

module.exports = { calculateSimpleInterest, calculateCompoundInterest, calculateLoanRepayment, buildRepaymentSchedule };
