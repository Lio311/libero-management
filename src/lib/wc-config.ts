export type Brand = 'velour' | 'labura' | 'libero';

export const BRAND_CONFIG: Record<Brand, { ck: string; cs: string; baseUrl: string }> = {
    velour: {
        ck: process.env.VELOUR_WC_CK || 'ck_50e2712ebe187cae81f5a2b6353c0a316067eefe',
        cs: process.env.VELOUR_WC_CS || 'cs_fe5ad58ff939b47a0856f5a9c3478cefa5c74c04',
        baseUrl: 'https://velour.co.il',
    },
    labura: {
        ck: process.env.LABURA_WC_CK || 'ck_c05a4ccf7b36d2c7f5aeee1307db0da45512c306',
        cs: process.env.LABURA_WC_CS || 'cs_d3d1d9eba2cf904b5a4b4324b1fba75d4a1da2c2',
        baseUrl: 'https://la-burro.co.il',
    },
    libero: {
        ck: process.env.LIBERO_WC_CK || '[REDACTED_CK]',
        cs: process.env.LIBERO_WC_CS || '[REDACTED_CS]',
        baseUrl: 'https://libero-il.co.il',
    }
};
