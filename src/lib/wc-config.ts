export type Brand = 'velour' | 'labura' | 'libero';

export const BRAND_CONFIG: Record<Brand, { ck: string; cs: string; baseUrl: string }> = {
    velour: {
        ck: process.env.VELOUR_WC_CK || process.env.LIBERO_WC_CK || 'ck_50e2712ebe187cae81f5a2b6353c0a316067eefe',
        cs: process.env.VELOUR_WC_CS || process.env.LIBERO_WC_CS || 'cs_fe5ad58ff939b47a0856f5a9c3478cefa5c74c04',
        baseUrl: 'https://velour.co.il',
    },
    labura: {
        ck: process.env.LABURA_WC_CK || process.env.LIBERO_WC_CK || 'ck_017b2b528659550e5033d59bc4e2402bc0b78c80',
        cs: process.env.LABURA_WC_CS || process.env.LIBERO_WC_CS || 'cs_f77259f972b9380df1dbb5329f6b9a8449c2deec',
        baseUrl: 'https://la-burro.co.il',
    },
    libero: {
        ck: process.env.LIBERO_WC_CK || '[REDACTED_CK]',
        cs: process.env.LIBERO_WC_CS || '[REDACTED_CS]',
        baseUrl: 'https://libero-il.co.il',
    }
};
