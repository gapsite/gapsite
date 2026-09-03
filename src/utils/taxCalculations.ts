import { TaxType, TaxObligation } from '../types';

export interface TaxCalculationResult {
  taxType: TaxType;
  taxableBaseAmount: number; // DPP
  taxRatePercent: number;
  ppnOutputAmount?: number;
  ppnInputAmount?: number;
  taxAmount: number; // Final payable tax (Hutang Pajak)
  description: string;
}

/**
 * Standard Indonesian Tax Rates & Calculations
 */
export const TAX_TYPE_CONFIGS: Record<
  TaxType,
  {
    name: string;
    shortName: string;
    defaultRate: number;
    description: string;
    categoryGroup: 'PPN' | 'PPH' | 'OTHER';
    color: string;
  }
> = {
  PPN: {
    name: 'PPN (Pajak Pertambahan Nilai 11%)',
    shortName: 'PPN 11%',
    defaultRate: 11,
    description: 'Pajak Pertambahan Nilai atas penyerahan Jasa Kena Pajak (JKP) Konsultansi & Sertifikasi TKDN. Selisih PPN Keluaran dikurangi PPN Masukan.',
    categoryGroup: 'PPN',
    color: 'emerald',
  },
  PPH_21: {
    name: 'PPh Pasal 21 (Gaji & Honor Tenaga Ahli)',
    shortName: 'PPh 21',
    defaultRate: 5,
    description: 'Pemotongan pajak atas penghasilan berupa gaji, upah, honorarium asesor, tenaga ahli & tim audit.',
    categoryGroup: 'PPH',
    color: 'blue',
  },
  PPH_22: {
    name: 'PPh Pasal 22 (Pengadaan & Proyek Pemerintah / BUMN)',
    shortName: 'PPh 22 (1.5%)',
    defaultRate: 1.5,
    description: 'Pajak pemungutan 1.5% oleh Bendahara Pengeluaran Pemerintah / BUMN atas pembayaran proyek pengadaan barang/jasa APBN/APBD.',
    categoryGroup: 'PPH',
    color: 'sky',
  },
  PPH_23: {
    name: 'PPh Pasal 23 (Jasa Surveyor & Konsultansi)',
    shortName: 'PPh 23 (2%)',
    defaultRate: 2,
    description: 'Pajak potong pungut 2% atas transaksi Jasa Manajemen, Jasa Konsultan & Jasa Pengujian Surveyor (Sucofindo / Surveyor Indonesia).',
    categoryGroup: 'PPH',
    color: 'purple',
  },
  PPH_4_2: {
    name: 'PPh Final Pasal 4 ayat (2) (Sewa Kantor & Bangunan)',
    shortName: 'PPh 4(2) (10%)',
    defaultRate: 10,
    description: 'Pajak penghasilan final 10% atas sewa tanah, gedung kantor operasional atau jasa konstruksi tertentu.',
    categoryGroup: 'PPH',
    color: 'amber',
  },
  PPH_FINAL_UMKM: {
    name: 'PPh Final PP 23/55 (0.5% dari Omzet Bruto)',
    shortName: 'PPh Final 0.5%',
    defaultRate: 0.5,
    description: 'Pajak Penghasilan Final UMKM sebesar 0.5% dari peredaran bruto (omzet) bulanan perusahaan.',
    categoryGroup: 'PPH',
    color: 'teal',
  },
  PPH_25_29: {
    name: 'PPh Badan Pasal 25 / 29 (Angsuran & Tahunan)',
    shortName: 'PPh Badan 22%',
    defaultRate: 22,
    description: 'Kewajiban angsuran bulanan PPh Pasal 25 atau pelunasan PPh Badan Pasal 29 di akhir tahun pajak.',
    categoryGroup: 'PPH',
    color: 'rose',
  },
  OTHER_TAX: {
    name: 'Pajak Lain-lain / Retribusi Daerah',
    shortName: 'Pajak Lain',
    defaultRate: 0,
    description: 'Kewajiban perpajakan atau retribusi lain yang terhutang ke kas negara / kas daerah.',
    categoryGroup: 'OTHER',
    color: 'slate',
  },
};

/**
 * Calculate Tax Amount given base parameters
 */
export function calculateTaxObligationAmount(params: {
  taxType: TaxType;
  taxableBaseAmount?: number;
  taxRatePercent?: number;
  ppnOutputAmount?: number;
  ppnInputAmount?: number;
}): TaxCalculationResult {
  const { taxType, taxableBaseAmount = 0, taxRatePercent, ppnOutputAmount, ppnInputAmount } = params;
  const cfg = TAX_TYPE_CONFIGS[taxType] || TAX_TYPE_CONFIGS.OTHER_TAX;
  const rate = typeof taxRatePercent === 'number' ? taxRatePercent : cfg.defaultRate;

  if (taxType === 'PPN') {
    // If output/input VAT are specified directly
    if (ppnOutputAmount !== undefined || ppnInputAmount !== undefined) {
      const outVal = ppnOutputAmount || Math.round((taxableBaseAmount * rate) / 100);
      const inVal = ppnInputAmount || 0;
      const netTax = Math.max(0, outVal - inVal);
      return {
        taxType: 'PPN',
        taxableBaseAmount,
        taxRatePercent: rate,
        ppnOutputAmount: outVal,
        ppnInputAmount: inVal,
        taxAmount: netTax,
        description: `PPN Keluaran (Rp ${outVal.toLocaleString('id-ID')}) - PPN Masukan (Rp ${inVal.toLocaleString('id-ID')}) = Kurang Bayar Rp ${netTax.toLocaleString('id-ID')}`,
      };
    }
    // Standard Output PPN from DPP
    const outVal = Math.round((taxableBaseAmount * rate) / 100);
    return {
      taxType: 'PPN',
      taxableBaseAmount,
      taxRatePercent: rate,
      ppnOutputAmount: outVal,
      ppnInputAmount: 0,
      taxAmount: outVal,
      description: `PPN ${rate}% dari DPP Rp ${taxableBaseAmount.toLocaleString('id-ID')}`,
    };
  }

  // Withholding taxes: PPh 21, 23, 4(2), Final, Badan
  const calculatedTax = Math.round((taxableBaseAmount * rate) / 100);
  return {
    taxType,
    taxableBaseAmount,
    taxRatePercent: rate,
    taxAmount: calculatedTax,
    description: `${cfg.shortName} (${rate}%) dari DPP Rp ${taxableBaseAmount.toLocaleString('id-ID')}`,
  };
}

/**
 * Format Tax Type Label & Badge Color
 */
export function getTaxTypeBadge(taxType: TaxType) {
  const cfg = TAX_TYPE_CONFIGS[taxType] || TAX_TYPE_CONFIGS.OTHER_TAX;
  return {
    label: cfg.shortName,
    fullName: cfg.name,
    color: cfg.color,
    group: cfg.categoryGroup,
  };
}

/**
 * Generate synchronized default description based on tax type, rate, and optional details
 */
export function getDefaultTaxDescription(params: {
  taxType: TaxType;
  taxRatePercent?: number;
  counterpartyName?: string;
  projectCode?: string;
}): string {
  const cfg = TAX_TYPE_CONFIGS[params.taxType] || TAX_TYPE_CONFIGS.OTHER_TAX;
  const rate = params.taxRatePercent !== undefined ? params.taxRatePercent : cfg.defaultRate;
  const counterparty = params.counterpartyName?.trim() ? ` Lawan transaksi: ${params.counterpartyName.trim()}` : '';
  const project = params.projectCode?.trim() ? ` [Proyek ${params.projectCode.trim()}]` : '';

  switch (params.taxType) {
    case 'PPN':
      return `PPN ${rate}% atas Faktur Pajak Keluaran Penyerahan JKP Konsultansi & Sertifikasi TKDN dikurangi Pajak Masukan.${project}${counterparty}`;
    case 'PPH_23':
      return `Pemotongan PPh 23 (${rate}%) atas transaksi Jasa Manajemen, Jasa Konsultan, atau Jasa Pengujian Surveyor.${project}${counterparty}`;
    case 'PPH_21':
      return `Pemotongan PPh 21 (${rate}%) atas gaji, upah, atau honorarium tenaga ahli / asesor.${project}${counterparty}`;
    case 'PPH_4_2':
      return `PPh Final Pasal 4 ayat (2) (${rate}%) atas sewa kantor, ruko operasional atau jasa konstruksi.${project}${counterparty}`;
    case 'PPH_FINAL_UMKM':
      return `PPh Final PP 23/55 (${rate}%) dari omzet bruto peredaran usaha bulanan.${project}${counterparty}`;
    case 'PPH_25_29':
      return `Angsuran PPh Pasal 25 bulanan atau pelunasan PPh Badan Pasal 29 tahunan perusahaan.${project}${counterparty}`;
    default:
      return `${cfg.description}.${project}${counterparty}`;
  }
}

/**
 * Check if a tax obligation has a mismatched description (e.g., PPh 23 record with PPN description)
 * and return the sanitized/synchronized tax obligation.
 */
export function syncTaxObligationDescription(obligation: TaxObligation): TaxObligation {
  if (!obligation) return obligation;

  const desc = (obligation.description || '').trim();
  const lowerDesc = desc.toLowerCase();
  const isPpnDesc = lowerDesc.includes('ppn 11%') || lowerDesc.includes('faktur pajak keluaran') || lowerDesc.includes('pajak masukan');
  const isPphDesc = lowerDesc.includes('pph 23') || lowerDesc.includes('pph 21') || lowerDesc.includes('pph 4') || lowerDesc.includes('pph final') || lowerDesc.includes('pph badan');

  // Case 1: Tax type is NOT PPN (e.g. PPH_23, PPH_21), but description refers to PPN / Faktur Pajak Keluaran
  if (obligation.taxType !== 'PPN' && isPpnDesc) {
    return {
      ...obligation,
      description: getDefaultTaxDescription({
        taxType: obligation.taxType,
        taxRatePercent: obligation.taxRatePercent,
        counterpartyName: obligation.counterpartyName,
        projectCode: obligation.projectCode,
      }),
    };
  }

  // Case 2: Tax type is PPN, but description solely mentions PPh
  if (obligation.taxType === 'PPN' && isPphDesc && !lowerDesc.includes('ppn')) {
    return {
      ...obligation,
      description: getDefaultTaxDescription({
        taxType: 'PPN',
        taxRatePercent: obligation.taxRatePercent || 11,
        counterpartyName: obligation.counterpartyName,
        projectCode: obligation.projectCode,
      }),
    };
  }

  // Case 3: Empty description
  if (!desc) {
    return {
      ...obligation,
      description: getDefaultTaxDescription({
        taxType: obligation.taxType,
        taxRatePercent: obligation.taxRatePercent,
        counterpartyName: obligation.counterpartyName,
        projectCode: obligation.projectCode,
      }),
    };
  }

  return obligation;
}
