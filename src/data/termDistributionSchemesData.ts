import { TermDistributionSchemeDefinition } from '../types';

export const DEFAULT_TERM_DISTRIBUTION_SCHEMES: TermDistributionSchemeDefinition[] = [
  {
    id: 'SCHEME_3_TERMIN_20_40_40',
    name: 'Standar 3 Termin (20% - 40% - 40%)',
    description: 'Skema termin standar APBN/Kemenkeu: Uang Muka 20%, Laporan Antara & Progres Lapangan 40%, dan Pelunasan BAST 40%.',
    termCount: 3,
    terms: [
      {
        termNumber: 1,
        title: 'Termin I - Uang Muka / Mobilisasi (20%)',
        percentage: 20,
        description: 'Pencairan uang muka setelah penandatanganan SPK & Jaminan Uang Muka (jika disyaratkan).',
      },
      {
        termNumber: 2,
        title: 'Termin II - Laporan Antara & Verifikasi 50% (40%)',
        percentage: 40,
        description: 'Pencairan setelah pengesahan BAP Progres Fisik 50% dan submit Laporan Antara.',
      },
      {
        termNumber: 3,
        title: 'Termin III - BAST & Sertifikat Terbit 100% (40%)',
        percentage: 40,
        description: 'Pelunasan 100% setelah penyerahan sertifikat TKDN resmi dan penandatanganan BAST Final.',
      },
    ],
    isSystemDefault: true,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SCHEME_2_TERMIN_50_50',
    name: '2 Termin (50% - 50%)',
    description: 'Skema pembagian proporsional 2 tahap: Tahap Awal 50% dan Pelunasan BAST 50%.',
    termCount: 2,
    terms: [
      {
        termNumber: 1,
        title: 'Termin I - Uang Muka & Pelaksanaan Awal (50%)',
        percentage: 50,
        description: 'Tahap awal persiapan data dan pengumpulan bukti pendukung.',
      },
      {
        termNumber: 2,
        title: 'Termin II - BAST Akhir & Pelunasan (50%)',
        percentage: 50,
        description: 'Pelunasan setelah seluruh pekerjaan tuntas 100%.',
      },
    ],
    isSystemDefault: true,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SCHEME_1_TERMIN_100',
    name: '1 Kali (100% Sekaligus)',
    description: 'Pembayaran tunggal 100% setelah seluruh pekerjaan konsultansi selesai dan BAST disahkan PPK.',
    termCount: 1,
    terms: [
      {
        termNumber: 1,
        title: 'Pembayaran 100% Sekaligus (BAST Selesai)',
        percentage: 100,
        description: 'Pencairan SPM/SP2D sekaligus setelah penerbitan BAST dan Invoice.',
      },
    ],
    isSystemDefault: true,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SCHEME_4_TERMIN_PUPR',
    name: '4 Termin Bertahap (15% - 30% - 35% - 20%)',
    description: 'Skema 4 termin bertahap: Uang Muka 15%, Verifikasi 30%, Sidang Teknis 35%, dan Retensi/BAST 20%.',
    termCount: 4,
    terms: [
      {
        termNumber: 1,
        title: 'Termin I - Uang Muka & Rencana Kerja (15%)',
        percentage: 15,
        description: 'Pencairan Uang Muka pekerjaan awal.',
      },
      {
        termNumber: 2,
        title: 'Termin II - Verifikasi Lapangan & Data (30%)',
        percentage: 30,
        description: 'Penyelesaian survey lapangan dan audit dokumen pendukung.',
      },
      {
        termNumber: 3,
        title: 'Termin III - Sidang Panel & Rekomendasi (35%)',
        percentage: 35,
        description: 'Penyelesaian sidang komite teknis surveyor independen.',
      },
      {
        termNumber: 4,
        title: 'Termin IV - BAST & Terbit Sertifikat (20%)',
        percentage: 20,
        description: 'Pelunasan akhir dan serah terima dokumen sertifikasi.',
      },
    ],
    isSystemDefault: true,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SCHEME_3_TERMIN_30_30_40',
    name: '3 Termin Konsultansi (30% - 30% - 40%)',
    description: 'Skema jasa konsultansi pendampingan: DP 30%, Progres 50% 30%, dan Laporan Akhir BAST 40%.',
    termCount: 3,
    terms: [
      {
        termNumber: 1,
        title: 'Termin I - Uang Muka Kontrak (30%)',
        percentage: 30,
        description: 'Pencairan DP kontrak pelaksanaan pendampingan.',
      },
      {
        termNumber: 2,
        title: 'Termin II - Laporan Antara & Progres 50% (30%)',
        percentage: 30,
        description: 'Pengesahan laporan antara verifikasi teknis.',
      },
      {
        termNumber: 3,
        title: 'Termin III - Laporan Akhir & BAST Final (40%)',
        percentage: 40,
        description: 'Pelunasan setelah terbit sertifikasi resmi kementerian.',
      },
    ],
    isSystemDefault: true,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
  },
];
