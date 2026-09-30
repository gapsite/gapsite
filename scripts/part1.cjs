const fs = require('fs');

const part1 = {
  version: "2.0",
  appName: "KCK CRM",
  exportedAt: "2026-09-28T07:50:55.701Z",
  exportedBy: "Adryan kelvianto",
  summary: {
    projectsCount: 0,
    dispositionsCount: 0,
    transactionsCount: 548,
    receivablesCount: 18,
    taxObligationsCount: 352,
    payrollsCount: 241,
    governmentProjectsCount: 3,
    retailProjectsCount: 57,
    overheadExpensesCount: 62,
    officeRentContractsCount: 3,
    bankLoansCount: 3,
    teamMembersCount: 1
  },
  teamMembers: [
    {
      activeTaskCount: 0,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      bankAccountHolder: "Adryan kelvianto",
      bankAccountNumber: "2916211993",
      bankName: "Bank BCA",
      bio: "",
      capacityPercentage: 0,
      clientCompany: "",
      completedTaskCount: 0,
      department: "Central Compliance Governance & Board",
      email: "adryankelvianto250@gmail.com",
      id: "usr-0",
      idType: "NIK",
      lastLoginAt: "Just now",
      lastSyncedAt: "2026-09-14T14:30:08.620Z",
      name: "Adryan kelvianto",
      nik: "3171012304950001",
      notificationPreferences: {
        emailNotifications: true,
        inAppDispatches: true,
        weeklySummary: false,
        whatsappAlerts: true
      },
      permissions: [
        "MANAGE_USERS_ROLES",
        "VERIFY_NEW_USERS",
        "MANAGE_SERVICE_TYPES",
        "MANAGE_DOCUMENT_TYPES",
        "VIEW_PROJECTS",
        "CREATE_PROJECTS",
        "EDIT_PROJECTS",
        "DELETE_PROJECTS",
        "CALCULATE_TKDN",
        "UPLOAD_DOCUMENTS",
        "VERIFY_DOCUMENTS",
        "SIGNOFF_MILESTONES",
        "MANAGE_DISPOSITIONS",
        "MANAGE_FINANCE",
        "EXPORT_AUDIT_REPORTS"
      ],
      phone: "+62 811-9988-7711",
      pin: "120812",
      registrationNumber: "",
      role: "MASTER_ADMIN",
      roleTitle: "Chief Role Master & System SuperAdmin",
      signatureImage: "",
      signatureText: "Adryan kelvianto",
      specialization: [
        "Master Access Governance",
        "Statutory Verification Audits",
        "SIINas National Registry",
        "Supreme RBAC Authority"
      ],
      status: "ACTIVE",
      themeAccent: "amber",
      username: "admin.master"
    }
  ],
  companyCapital: {
    authorizedCapital: 5000000000,
    paidInCapital: 100000000,
    additionalCapital: 0,
    retainedEarningsOpening: 0,
    notes: "Sesuai Akta Pendirian Perseroan Terbatas & Keputusan Menkumham RI.",
    updatedAt: "2026-09-17T06:18:20.457Z",
    updatedBy: "admin.master"
  }
};

fs.writeFileSync('scripts/part1.json', JSON.stringify(part1, null, 2), 'utf8');
console.log('part1.json written');
