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
