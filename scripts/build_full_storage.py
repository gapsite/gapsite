import json

# Load existing
with open('data/crm_persistent_storage.json', 'r', encoding='utf-8') as f:
    storage = json.load(f)

data = storage.get('data', {})

# Transactions to ensure are present (especially the 540M transactions)
new_trxs = [
    {
        "amountIDR": 540000000,
        "category": "BANK_LOAN_DISBURSEMENT",
        "clientOrVendorName": "Bank Rakyat Indonesia (BRI)",
        "createdAt": "2026-09-28T07:47:54.131Z",
        "date": "2024-09-10",
        "description": "Pencairan Pokok Fasilitas Pinjaman Bank (Non-Revolving): Pinjaman Perorangan (Bank Rakyat Indonesia (BRI))",
        "id": "trx-1790581674131-0027-u1as4j",
        "notes": "Pencairan pokok fasilitas pinjaman modal kerja Pinjaman Perorangan (Bank Rakyat Indonesia (BRI))",
        "paymentMethod": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "projectCode": "",
        "projectId": "",
        "recordedBy": "Adryan kelvianto",
        "referenceNumber": "LOAN-DISB-BANK-1754",
        "status": "CLEARED",
        "transactionNumber": "TRX-202409-0004",
        "type": "INCOME",
        "updatedAt": "2026-09-28T07:47:54.136Z"
    },
    {
        "amountIDR": 540000000,
        "category": "RETAIL_PROJECT_INCOME",
        "clientOrVendorName": "Adryan",
        "createdAt": "2026-09-28T07:49:13.077Z",
        "date": "2024-09-25",
        "description": "Penerimaan Pembayaran Termin 1: Pembayaran Lunas Dimuka (100% DP) - Pinjaman Modal (Adryan)",
        "id": "trx-retail-inc-ret-1790581753077-0028-2d1kbg-ret-m-1kbg-t1-1790581753077-0029-rrx909",
        "notes": "Pembayaran Klien Retail: Adryan | Termin 1 | Bruto DPP: Rp 540.000.000 | PPN 11%: Rp 0 | Potongan PPh 23: Rp 0 | Kas Bersih Diterima: Rp 540.000.000",
        "paymentMethod": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "projectCode": "",
        "projectId": "ret-1790581753077-0028-2d1kbg",
        "recordedBy": "Adryan kelvianto",
        "referenceNumber": "TRF-753077",
        "status": "CLEARED",
        "transactionNumber": "TRX-RTL-202409-687",
        "type": "INCOME",
        "updatedAt": "2026-09-28T07:49:13.081Z"
    },
    {
        "amountIDR": 77700000,
        "category": "OPERATIONAL_OFFICE",
        "clientOrVendorName": "PT Surveyor Indonesia",
        "createdAt": "2026-09-28T07:22:57.381Z",
        "date": "2024-04-04",
        "description": "[Overhead - LAIN_LAIN] Pembayaran Pelatihan TKDN (PT Surveyor Indonesia)",
        "id": "trx-ovh-005646-1790580177381-0006-gld88n",
        "notes": "Pengeluaran kebutuhan operasional kantor: -",
        "paymentMethod": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "projectCode": "",
        "projectId": "",
        "recordedBy": "Adryan kelvianto",
        "referenceNumber": "OVH-202404-0002",
        "status": "CLEARED",
        "transactionNumber": "TRX-OVH-202404-0001",
        "type": "EXPENSE",
        "updatedAt": "2026-09-28T07:22:57.384Z"
    },
    {
        "amountIDR": 153180000,
        "category": "OPERATIONAL_OFFICE",
        "clientOrVendorName": "PT Surveyor Indonesia",
        "createdAt": "2026-09-28T07:23:44.660Z",
        "date": "2024-08-28",
        "description": "[Overhead - LAIN_LAIN] Pembayaran Pelatihan TKDN (PT Surveyor Indonesia)",
        "id": "trx-ovh-7lumka-1790580224660-0008-ffnrrp",
        "notes": "Pengeluaran kebutuhan operasional kantor: -",
        "paymentMethod": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "projectCode": "",
        "projectId": "",
        "recordedBy": "Adryan kelvianto",
        "referenceNumber": "OVH-202408-0006",
        "status": "CLEARED",
        "transactionNumber": "TRX-OVH-202408-0001",
        "type": "EXPENSE",
        "updatedAt": "2026-09-28T07:23:44.663Z"
    },
    {
        "amountIDR": 297588000,
        "category": "OPERATIONAL_OFFICE",
        "clientOrVendorName": "PT Surveyor Indonesia",
        "createdAt": "2026-09-28T07:24:35.439Z",
        "date": "2024-08-28",
        "description": "[Overhead - LAIN_LAIN] Pembayaran Pelatihan TKDN (PT Surveyor Indonesia)",
        "id": "trx-ovh-n3b6ke-1790580275439-0010-io4kci",
        "notes": "Pengeluaran kebutuhan operasional kantor: -",
        "paymentMethod": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "projectCode": "",
        "projectId": "",
        "recordedBy": "Adryan kelvianto",
        "referenceNumber": "OVH-202408-0007",
        "status": "CLEARED",
        "transactionNumber": "TRX-OVH-202408-0002",
        "type": "EXPENSE",
        "updatedAt": "2026-09-28T07:24:35.441Z"
    },
    {
        "amountIDR": 63825000,
        "category": "OPERATIONAL_OFFICE",
        "clientOrVendorName": "PT Surveyor Indonesia",
        "createdAt": "2026-09-28T07:32:25.654Z",
        "date": "2024-07-03",
        "description": "[Overhead - LAIN_LAIN] Pembayaran TKDN DP 50% PT Epower Motor Indonesia (PT Surveyor Indonesia)",
        "id": "trx-ovh-zoc56r-1790580745655-0013-b9y86s",
        "notes": "Pengeluaran kebutuhan operasional kantor: -",
        "paymentMethod": "BANK_BRI_CORPORATE_TRANSFER",
        "projectCode": "",
        "projectId": "",
        "recordedBy": "Adryan kelvianto",
        "referenceNumber": "OVH-202407-0002",
        "status": "CLEARED",
        "transactionNumber": "TRX-OVH-202407-0001",
        "type": "EXPENSE",
        "updatedAt": "2026-09-28T07:32:25.658Z"
    },
    {
        "amountIDR": 65490000,
        "category": "OPERATIONAL_OFFICE",
        "clientOrVendorName": "PT Surveyor Indonesia",
        "createdAt": "2026-09-28T07:38:09.711Z",
        "date": "2024-07-10",
        "description": "[Overhead - LAIN_LAIN] Pembayaran DP 50% PT Triangle Motorindo (PT Surveyor Indonesia)",
        "id": "trx-ovh-ei5g1k-1790581089711-0015-yvir5q",
        "notes": "Pengeluaran kebutuhan operasional kantor: -",
        "paymentMethod": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "projectCode": "",
        "projectId": "",
        "recordedBy": "Adryan kelvianto",
        "referenceNumber": "OVH-202407-0003",
        "status": "CLEARED",
        "transactionNumber": "TRX-OVH-202407-0002",
        "type": "EXPENSE",
        "updatedAt": "2026-09-28T07:38:09.715Z"
    },
    {
        "amountIDR": 63825000,
        "category": "OPERATIONAL_OFFICE",
        "clientOrVendorName": "PT Surveyor Indonesia",
        "createdAt": "2026-09-28T07:38:59.836Z",
        "date": "2024-07-03",
        "description": "[Overhead - LAIN_LAIN] Pembayaran TKDN Pelunasan PT Epower Motor Indonesia (PT Surveyor Indonesia)",
        "id": "trx-ovh-6fab6w-1790581139836-0017-lsra41",
        "notes": "Pengeluaran kebutuhan operasional kantor: -",
        "paymentMethod": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "projectCode": "",
        "projectId": "",
        "recordedBy": "Adryan kelvianto",
        "referenceNumber": "OVH-202407-0004",
        "status": "CLEARED",
        "transactionNumber": "TRX-OVH-202407-0003",
        "type": "EXPENSE",
        "updatedAt": "2026-09-28T07:38:59.839Z"
    },
    {
        "amountIDR": 15000000,
        "category": "GAJI_KARYAWAN",
        "clientOrVendorName": "Adryan kelvianto",
        "createdAt": "2026-09-28T07:41:17.098Z",
        "date": "2024-04-08",
        "description": "THR Karyawan: Adryan kelvianto (Chief Role Master & System SuperAdmin) - Idul Fitri 1447 H / 2026 M",
        "id": "trx-1790581277098-0019-1pa5me",
        "notes": "Slip: THR/2026/09/EMP-238 | Kategori: THR | Bruto: Rp 15.000.000 | Potongan: Rp 0 | Net THP: Rp 15.000.000",
        "paymentMethod": "BANK_TRANSFER",
        "recordedBy": "Adryan kelvianto",
        "referenceNumber": "THR/2026/09/EMP-238",
        "status": "CLEARED",
        "transactionNumber": "TRX-202404-0002",
        "type": "EXPENSE",
        "updatedAt": "2026-09-28T07:41:17.103Z"
    },
    {
        "amountIDR": 15000000,
        "category": "GAJI_KARYAWAN",
        "clientOrVendorName": "Christoblle Bayu A.P",
        "createdAt": "2026-09-28T07:45:56.528Z",
        "date": "2024-04-08",
        "description": "THR Karyawan: Christoblle Bayu A.P (Technical Assessor / BOM Specialist) - Idul Fitri 1445 H",
        "id": "trx-1790581556528-0021-qp3482",
        "notes": "Slip: THR/2026/09/EMP-239 | Kategori: THR | Bruto: Rp 15.000.000 | Potongan: Rp 0 | Net THP: Rp 15.000.000",
        "paymentMethod": "BANK_TRANSFER",
        "recordedBy": "Adryan kelvianto",
        "referenceNumber": "THR/2026/09/EMP-239",
        "status": "CLEARED",
        "transactionNumber": "TRX-202404-0003",
        "type": "EXPENSE",
        "updatedAt": "2026-09-28T07:45:56.533Z"
    },
    {
        "amountIDR": 5000000,
        "category": "GAJI_KARYAWAN",
        "clientOrVendorName": "Amanda Alma Septiriani",
        "createdAt": "2026-09-28T07:46:33.351Z",
        "date": "2024-04-08",
        "description": "THR Karyawan: Amanda Alma Septiriani (Technical Assessor / BOM Specialist) - Idul Fitri 1445 H",
        "id": "trx-1790581593351-0023-y69pb7",
        "notes": "Slip: THR/2026/09/EMP-240 | Kategori: THR | Bruto: Rp 5.000.000 | Potongan: Rp 0 | Net THP: Rp 5.000.000",
        "paymentMethod": "BANK_TRANSFER",
        "recordedBy": "Adryan kelvianto",
        "referenceNumber": "THR/2026/09/EMP-240",
        "status": "CLEARED",
        "transactionNumber": "TRX-202404-0004",
        "type": "EXPENSE",
        "updatedAt": "2026-09-28T07:46:33.357Z"
    },
    {
        "amountIDR": 5000000,
        "category": "GAJI_KARYAWAN",
        "clientOrVendorName": "Satrio Budi Margono Alghifari",
        "createdAt": "2026-09-28T07:46:56.062Z",
        "date": "2024-04-08",
        "description": "THR Karyawan: Satrio Budi Margono Alghifari (Technical Assessor / BOM Specialist) - Idul Fitri 1445 H",
        "id": "trx-1790581616062-0025-pnesfv",
        "notes": "Slip: THR/2026/09/EMP-241 | Kategori: THR | Bruto: Rp 5.000.000 | Potongan: Rp 0 | Net THP: Rp 5.000.000",
        "paymentMethod": "BANK_TRANSFER",
        "recordedBy": "Adryan kelvianto",
        "referenceNumber": "THR/2026/09/EMP-241",
        "status": "CLEARED",
        "transactionNumber": "TRX-202404-0005",
        "type": "EXPENSE",
        "updatedAt": "2026-09-28T07:46:56.067Z"
    }
]

# Update transactions map
trx_map = {t['id']: t for t in data.get('transactions', [])}
for t in new_trxs:
    trx_map[t['id']] = t
data['transactions'] = list(trx_map.values())

# Update bankLoans
loan_540 = {
    "loanName": "Pinjaman Perorangan",
    "facilityType": "OTHER",
    "bankName": "Bank Rakyat Indonesia (BRI)",
    "principalAmount": 540000000,
    "annualInterestRate": 0,
    "tenureMonths": 24,
    "startDate": "2024-09-10",
    "paymentChannelId": "BANK_BRI_CORPORATE_TRANSFER_OPS",
    "purpose": "Modal Kerja & Operasional Sertifikasi TKDN",
    "isDisbursed": True,
    "status": "ACTIVE",
    "id": "loan-1790581667689-0026-628bru",
    "monthlyPrincipal": 22500000,
    "monthlyInterest": 0,
    "monthlyInstallment": 22500000,
    "totalInterest": 0,
    "totalPayment": 540000000,
    "remainingPrincipal": 540000000,
    "paidPrincipal": 0,
    "paidInterest": 0,
    "schedule": [
        {
            "monthNumber": i + 1,
            "dueDate": f"202{4 + (9 + i) // 12}-{(9 + i) % 12 + 1:02d}-10",
            "beginningBalance": 540000000 - (i * 22500000),
            "principalPayment": 22500000,
            "interestPayment": 0,
            "totalPayment": 22500000,
            "endingBalance": 540000000 - ((i + 1) * 22500000),
            "isPaid": False,
            "paymentType": "PRINCIPAL_AND_INTEREST"
        }
        for i in range(24)
    ],
    "createdAt": "2026-09-28T07:47:47.689Z",
    "createdBy": "admin.master",
    "disbursedAt": "2026-09-28T07:47:54.136Z",
    "disbursementTransactionId": "trx-1790581674131-0027-u1as4j",
    "updatedAt": "2026-09-28T07:47:54.138Z"
}

loans = data.get('bankLoans', [])
loan_map = {l['id']: l for l in loans}
loan_map[loan_540['id']] = loan_540
data['bankLoans'] = list(loan_map.values())

# Update retailProjects (Pinjaman Modal 540M)
retail_540 = {
    "clientName": "Adryan",
    "contractDate": "2024-09-25",
    "createdAt": "2026-09-28T07:49:13.077Z",
    "createdBy": "Adryan kelvianto",
    "id": "ret-1790581753077-0028-2d1kbg",
    "initialPaymentChannelId": "BANK_BRI_CORPORATE_TRANSFER_OPS",
    "initialPaymentDate": "2024-09-25",
    "invoicePaymentTermDays": 14,
    "milestones": [
        {
            "termNumber": 1,
            "title": "Pembayaran Lunas Dimuka (100% DP)",
            "percentage": 100,
            "grossAmountIDR": 540000000,
            "pricingType": "NON_PKP",
            "dppAmountIDR": 540000000,
            "ppnRatePercent": 0,
            "ppnAmountIDR": 0,
            "pphType": "NON_PPH",
            "pphRatePercent": 0,
            "pphAmountIDR": 0,
            "netDisbursementIDR": 540000000,
            "targetDate": "2024-09-25",
            "status": "LUNAS",
            "paidAmountIDR": 540000000,
            "paymentDate": "2024-09-25",
            "paymentChannelId": "BANK_BRI_CORPORATE_TRANSFER_OPS",
            "referenceNumber": "TRF-753077",
            "id": "ret-m-1kbg-t1-1790581753077-0029-rrx909",
            "projectId": "ret-1790581753077-0028-2d1kbg",
            "createdAt": "2026-09-28T07:49:13.077Z",
            "transactionId": "trx-retail-inc-ret-1790581753077-0028-2d1kbg-ret-m-1kbg-t1-1790581753077-0029-rrx909"
        }
    ],
    "paymentScheme": "LUNAS_DIMUKA",
    "pphRatePercent": 0,
    "pphType": "NON_PPH",
    "ppnRatePercent": 0,
    "pricingType": "NON_PKP",
    "projectName": "Pinjaman Modal",
    "recordInitialPaymentToCash": True,
    "serviceCategory": "LAINNYA",
    "status": "AKTIF",
    "totalBilledAmountIDR": 540000000,
    "totalContractValueIDR": 540000000,
    "totalOutstandingAmountIDR": 0,
    "totalReceivedAmountIDR": 540000000,
    "updatedAt": "2026-09-28T07:50:39.665Z"
}

ret_projects = data.get('retailProjects', [])
ret_map = {r['id']: r for r in ret_projects}
ret_map[retail_540['id']] = retail_540
data['retailProjects'] = list(ret_map.values())

# Update receivables (PT Epower Motor Indonesia 540M)
rec_540 = {
    "category": "TERMIN_KONSULTASI_TKDN",
    "clientAddress": "",
    "clientContactPerson": "Ibu Listya",
    "clientEmail": "",
    "clientName": "PT Epower Motor Indonesia",
    "clientPhone": "",
    "createdAt": "2026-09-28T07:31:05.306Z",
    "createdBy": "admin.master",
    "dueDate": "2024-08-14",
    "id": "rec-1790580665306-0011-mzchwi",
    "invoiceNumber": "004/KCK-Fk/TKDN-EMI/VII/24",
    "issueDate": "2024-07-15",
    "linkedTransactionIds": [],
    "milestoneTitle": "Pelunasan 100%",
    "notes": "",
    "paidAmountIDR": 0,
    "paymentTermsDays": 30,
    "payments": [],
    "projectCode": "",
    "projectId": "",
    "remainingAmountIDR": 540000000,
    "status": "JATUH_TEMPO",
    "taxAmountIDR": 0,
    "taxIncluded": False,
    "title": "Tagihan Pelunasan Konsultansi TKDN 4 Produk Motor Listrik",
    "totalAmountIDR": 540000000,
    "updatedAt": "2026-09-28T07:50:39.626Z"
}

rec_list = data.get('receivables', [])
rec_map = {r['id']: r for r in rec_list}
rec_map[rec_540['id']] = rec_540
data['receivables'] = list(rec_map.values())

# Update overheads
new_ovh = [
    {
        "amountIDR": 77700000,
        "approvedBy": "Finance Manager",
        "category": "LAIN_LAIN",
        "createdAt": "2026-09-28T07:22:57.381Z",
        "createdBy": "Adryan kelvianto",
        "date": "2024-04-04",
        "division": "Konsultan & Teknis",
        "hasTax": False,
        "id": "ovh-1790580177381-0005-005646",
        "netPaymentIDR": 77700000,
        "notes": "",
        "overheadNumber": "OVH-202404-0002",
        "paidDate": "2024-04-04",
        "paymentChannelId": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "receiptAttachment": "",
        "requestedBy": "Staff Operasional",
        "status": "PAID",
        "taxAmountIDR": 0,
        "title": "Pembayaran Pelatihan TKDN",
        "transactionId": "trx-ovh-005646-1790580177381-0006-gld88n",
        "updatedAt": "2026-09-28T07:50:39.682Z",
        "vendorOrMerchant": "PT Surveyor Indonesia"
    },
    {
        "amountIDR": 153180000,
        "approvedBy": "Finance Manager",
        "category": "LAIN_LAIN",
        "createdAt": "2026-09-28T07:23:44.660Z",
        "createdBy": "Adryan kelvianto",
        "date": "2024-08-28",
        "division": "Konsultan & Teknis",
        "hasTax": False,
        "id": "ovh-1790580224660-0007-7lumka",
        "netPaymentIDR": 153180000,
        "notes": "",
        "overheadNumber": "OVH-202408-0006",
        "paidDate": "2024-08-28",
        "paymentChannelId": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "receiptAttachment": "",
        "requestedBy": "Staff Operasional",
        "status": "PAID",
        "taxAmountIDR": 0,
        "title": "Pembayaran Pelatihan TKDN",
        "transactionId": "trx-ovh-7lumka-1790580224660-0008-ffnrrp",
        "updatedAt": "2026-09-28T07:50:39.682Z",
        "vendorOrMerchant": "PT Surveyor Indonesia"
    },
    {
        "amountIDR": 297588000,
        "approvedBy": "Finance Manager",
        "category": "LAIN_LAIN",
        "createdAt": "2026-09-28T07:24:35.439Z",
        "createdBy": "Adryan kelvianto",
        "date": "2024-08-28",
        "division": "Konsultan & Teknis",
        "hasTax": False,
        "id": "ovh-1790580275439-0009-n3b6ke",
        "netPaymentIDR": 297588000,
        "notes": "",
        "overheadNumber": "OVH-202408-0007",
        "paidDate": "2024-08-28",
        "paymentChannelId": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "receiptAttachment": "",
        "requestedBy": "Staff Operasional",
        "status": "PAID",
        "taxAmountIDR": 0,
        "title": "Pembayaran Pelatihan TKDN",
        "transactionId": "trx-ovh-n3b6ke-1790580275439-0010-io4kci",
        "updatedAt": "2026-09-28T07:50:39.683Z",
        "vendorOrMerchant": "PT Surveyor Indonesia"
    },
    {
        "amountIDR": 63825000,
        "approvedBy": "Finance Manager",
        "category": "LAIN_LAIN",
        "createdAt": "2026-09-28T07:32:25.654Z",
        "createdBy": "Adryan kelvianto",
        "date": "2024-07-03",
        "division": "Konsultan & Teknis",
        "hasTax": False,
        "id": "ovh-1790580745655-0012-zoc56r",
        "netPaymentIDR": 63825000,
        "notes": "",
        "overheadNumber": "OVH-202407-0002",
        "paidDate": "2024-07-03",
        "paymentChannelId": "BANK_BRI_CORPORATE_TRANSFER",
        "receiptAttachment": "",
        "requestedBy": "Staff Operasional",
        "status": "PAID",
        "taxAmountIDR": 0,
        "title": "Pembayaran TKDN DP 50% PT Epower Motor Indonesia",
        "transactionId": "trx-ovh-zoc56r-1790580745655-0013-b9y86s",
        "updatedAt": "2026-09-28T07:50:39.683Z",
        "vendorOrMerchant": "PT Surveyor Indonesia"
    },
    {
        "amountIDR": 65490000,
        "approvedBy": "Finance Manager",
        "category": "LAIN_LAIN",
        "createdAt": "2026-09-28T07:38:09.711Z",
        "createdBy": "Adryan kelvianto",
        "date": "2024-07-10",
        "division": "Konsultan & Teknis",
        "hasTax": False,
        "id": "ovh-1790581089711-0014-ei5g1k",
        "netPaymentIDR": 65490000,
        "notes": "",
        "overheadNumber": "OVH-202407-0003",
        "paidDate": "2024-07-10",
        "paymentChannelId": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "receiptAttachment": "",
        "requestedBy": "Staff Operasional",
        "status": "PAID",
        "taxAmountIDR": 0,
        "title": "Pembayaran DP 50% PT Triangle Motorindo",
        "transactionId": "trx-ovh-ei5g1k-1790581089711-0015-yvir5q",
        "updatedAt": "2026-09-28T07:50:39.683Z",
        "vendorOrMerchant": "PT Surveyor Indonesia"
    },
    {
        "amountIDR": 63825000,
        "approvedBy": "Finance Manager",
        "category": "LAIN_LAIN",
        "createdAt": "2026-09-28T07:38:59.836Z",
        "createdBy": "Adryan kelvianto",
        "date": "2024-07-03",
        "division": "Konsultan & Teknis",
        "hasTax": False,
        "id": "ovh-1790581139836-0016-6fab6w",
        "netPaymentIDR": 63825000,
        "notes": "",
        "overheadNumber": "OVH-202407-0004",
        "paidDate": "2024-07-03",
        "paymentChannelId": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "receiptAttachment": "",
        "requestedBy": "Staff Operasional",
        "status": "PAID",
        "taxAmountIDR": 0,
        "title": "Pembayaran TKDN Pelunasan PT Epower Motor Indonesia",
        "transactionId": "trx-ovh-6fab6w-1790581139836-0017-lsra41",
        "updatedAt": "2026-09-28T07:50:39.683Z",
        "vendorOrMerchant": "PT Surveyor Indonesia"
    }
]

ovh_list = data.get('overheadExpenses', [])
ovh_map = {o['id']: o for o in ovh_list}
for o in new_ovh:
    ovh_map[o['id']] = o
data['overheadExpenses'] = list(ovh_map.values())

# Update THR payroll payments
new_payroll = [
    {
        "bankAccountHolder": "Christoblle Bayu A.P",
        "basicSalary": 15000000,
        "createdAt": "2026-09-28T07:45:56.534Z",
        "department": "Technical & TKDN Calculations",
        "employeeId": "emp-1789372522588",
        "employeeName": "Christoblle Bayu A.P",
        "holidayName": "Idul Fitri 1445 H",
        "id": "pay-1445-1790581556528-0020-s6d1n2",
        "netSalary": 15000000,
        "paidAt": "2024-04-08",
        "paymentCategory": "THR",
        "paymentChannelId": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "paymentDate": "2024-04-08",
        "paymentMethod": "BANK_TRANSFER",
        "payrollNumber": "THR/2026/09/EMP-239",
        "period": "THR Idul Fitri 1445 H",
        "recordedBy": "Adryan kelvianto",
        "roleTitle": "Technical Assessor / BOM Specialist",
        "status": "PAID",
        "thrAmount": 15000000,
        "totalEarnings": 15000000,
        "transactionId": "trx-1790581556528-0021-qp3482",
        "updatedAt": "2026-09-28T07:45:56.534Z"
    },
    {
        "bankAccountHolder": "Christoblle Bayu A.P",
        "basicSalary": 5000000,
        "createdAt": "2026-09-28T07:46:33.357Z",
        "department": "Technical & TKDN Calculations",
        "employeeId": "emp-1789372522588",
        "employeeName": "Amanda Alma Septiriani",
        "holidayName": "Idul Fitri 1445 H",
        "id": "pay-1445-1790581593351-0022-uulhif",
        "netSalary": 5000000,
        "paidAt": "2024-04-08",
        "paymentCategory": "THR",
        "paymentChannelId": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "paymentDate": "2024-04-08",
        "paymentMethod": "BANK_TRANSFER",
        "payrollNumber": "THR/2026/09/EMP-240",
        "period": "THR Idul Fitri 1445 H",
        "recordedBy": "Adryan kelvianto",
        "roleTitle": "Technical Assessor / BOM Specialist",
        "status": "PAID",
        "thrAmount": 5000000,
        "totalEarnings": 5000000,
        "transactionId": "trx-1790581593351-0023-y69pb7",
        "updatedAt": "2026-09-28T07:46:33.357Z"
    },
    {
        "bankAccountHolder": "Christoblle Bayu A.P",
        "basicSalary": 5000000,
        "createdAt": "2026-09-28T07:46:56.068Z",
        "department": "Technical & TKDN Calculations",
        "employeeId": "emp-1789372522588",
        "employeeName": "Satrio Budi Margono Alghifari",
        "holidayName": "Idul Fitri 1445 H",
        "id": "pay-1445-1790581616062-0024-rvczyq",
        "netSalary": 5000000,
        "paidAt": "2024-04-08",
        "paymentCategory": "THR",
        "paymentChannelId": "BANK_BRI_CORPORATE_TRANSFER_OPS",
        "paymentDate": "2024-04-08",
        "paymentMethod": "BANK_TRANSFER",
        "payrollNumber": "THR/2026/09/EMP-241",
        "period": "THR Idul Fitri 1445 H",
        "recordedBy": "Adryan kelvianto",
        "roleTitle": "Technical Assessor / BOM Specialist",
        "status": "PAID",
        "thrAmount": 5000000,
        "totalEarnings": 5000000,
        "transactionId": "trx-1790581616062-0025-pnesfv",
        "updatedAt": "2026-09-28T07:46:56.068Z"
    },
    {
        "bankAccountHolder": "Adryan kelvianto",
        "basicSalary": 15000000,
        "createdAt": "2026-09-28T07:41:17.104Z",
        "department": "Central Compliance Governance & Board",
        "employeeId": "usr-0",
        "employeeName": "Adryan kelvianto",
        "holidayName": "Idul Fitri 1447 H / 2026 M",
        "id": "pay-2024-1790581277098-0018-gtwjjk",
        "netSalary": 15000000,
        "paidAt": "2024-04-08",
        "paymentCategory": "THR",
        "paymentChannelId": "BANK_BRI_CORPORATE_TRANSFER",
        "paymentDate": "2024-04-08",
        "paymentMethod": "BANK_TRANSFER",
        "payrollNumber": "THR/2026/09/EMP-238",
        "period": "THR Idul Fitri 2024",
        "recordedBy": "Adryan kelvianto",
        "roleTitle": "Chief Role Master & System SuperAdmin",
        "status": "PAID",
        "thrAmount": 15000000,
        "totalEarnings": 15000000,
        "transactionId": "trx-1790581277098-0019-1pa5me",
        "updatedAt": "2026-09-28T07:41:17.104Z"
    }
]

pay_list = data.get('payrollPayments', [])
pay_map = {p['id']: p for p in pay_list}
for p in new_payroll:
    pay_map[p['id']] = p
data['payrollPayments'] = list(pay_map.values())

storage['data'] = data
storage['updatedAt'] = "2026-09-28T07:50:55.701Z"

with open('data/crm_persistent_storage.json', 'w', encoding='utf-8') as f:
    json.dump(storage, f, indent=2, ensure_ascii=False)

print("Updated crm_persistent_storage.json with 540M transactions and all new records successfully!")
