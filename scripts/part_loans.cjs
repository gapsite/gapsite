const fs = require('fs');

const bankLoans = [
  {
    loanName: "Pinjaman Perorangan",
    facilityType: "OTHER",
    bankName: "Bank Rakyat Indonesia (BRI)",
    principalAmount: 540000000,
    annualInterestRate: 0,
    tenureMonths: 24,
    startDate: "2024-09-10",
    paymentChannelId: "BANK_BRI_CORPORATE_TRANSFER_OPS",
    purpose: "Modal Kerja & Operasional Sertifikasi TKDN",
    isDisbursed: true,
    status: "ACTIVE",
    id: "loan-1790581667689-0026-628bru",
    monthlyPrincipal: 22500000,
    monthlyInterest: 0,
    monthlyInstallment: 22500000,
    totalInterest: 0,
    totalPayment: 540000000,
    remainingPrincipal: 540000000,
    paidPrincipal: 0,
    paidInterest: 0,
    schedule: Array.from({ length: 24 }, (_, i) => ({
      monthNumber: i + 1,
      dueDate: `202${4 + Math.floor((9 + i) / 12)}-${String(((9 + i) % 12) + 1).padStart(2, '0')}-10`,
      beginningBalance: 540000000 - (i * 22500000),
      principalPayment: 22500000,
      interestPayment: 0,
      totalPayment: 22500000,
      endingBalance: 540000000 - ((i + 1) * 22500000),
      isPaid: false,
      paymentType: "PRINCIPAL_AND_INTEREST"
    })),
    createdAt: "2026-09-28T07:47:47.689Z",
    createdBy: "admin.master",
    disbursedAt: "2026-09-28T07:47:54.136Z",
    disbursementTransactionId: "trx-1790581674131-0027-u1as4j",
    updatedAt: "2026-09-28T07:47:54.138Z"
  }
];

fs.writeFileSync('scripts/bankLoans540.json', JSON.stringify(bankLoans, null, 2), 'utf8');
console.log('bankLoans540.json written');
