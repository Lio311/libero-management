export type Brand = 'velour' | 'labura' | 'libero';

export const BRAND_CONFIG: Record<Brand, { ck: string; cs: string; baseUrl: string }> = {
    velour: {
        ck: process.env.VELOUR_WC_CK || '',
        cs: process.env.VELOUR_WC_CS || '',
        baseUrl: 'https://velour.co.il',
    },
    labura: {
        ck: process.env.LABURA_WC_CK || '',
        cs: process.env.LABURA_WC_CS || '',
        baseUrl: 'https://la-burro.co.il',
    },
    libero: {
        ck: process.env.LIBERO_WC_CK || '',
        cs: process.env.LIBERO_WC_CS || '',
        baseUrl: 'https://libero-il.co.il',
    }
};
