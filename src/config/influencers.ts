export type Brand = 'velour' | 'labura' | 'libero';

export interface InfluencerCoupon {
  brand: Brand;
  code: string;
}

export interface InfluencerConfig {
  id: string;
  name: string;
  image?: string;
  hasVat?: boolean;
  baseSalary?: number;
  coupons: InfluencerCoupon[];
}

export const influencersConfig: Record<string, InfluencerConfig> = {
  mor: {
    id: 'mor',
    name: "מור אברג'ל",
    image: "/influencers/mor.png",
    coupons: [
      { brand: 'velour', code: 'mor10' },
      { brand: 'labura', code: 'mor15' }
    ]
  },
  noy: {
    id: 'noy',
    name: "נוי מקונן",
    image: "/influencers/noy.png",
    coupons: [
      { brand: 'velour', code: 'noy10' }
    ]
  },
  maayan: {
    id: 'maayan',
    name: "מעיין פלח",
    image: "/influencers/maayan.jpg",
    coupons: [
      { brand: 'velour', code: 'maayan10' }
    ]
  },
  amit: {
    id: 'amit',
    name: "עמית טראש",
    image: "/influencers/amit.jpg",
    coupons: [
      { brand: 'velour', code: 'amit15' }
    ]
  },
  tal: {
    id: 'tal',
    name: "טל",
    image: "/influencers/tal.jpg",
    coupons: [
      { brand: 'velour', code: 'tal10' }
    ]
  },
  ayala: {
    id: 'ayala',
    name: "איילה אריאל",
    image: "/influencers/ayala.jpg",
    baseSalary: 2000,
    coupons: [
      { brand: 'velour', code: 'ayala10' }
    ]
  },
  gold: {
    id: 'gold',
    name: "ניצן גולדשמידט",
    coupons: [
      { brand: 'velour', code: 'gold10' }
    ]
  },
  noga: {
    id: 'noga',
    name: "נוגה אינגר",
    image: "/influencers/noga.jpg",
    coupons: [
      { brand: 'velour', code: 'noga10' },
      { brand: 'labura', code: 'noga15' }
    ]
  },
  noa: {
    id: 'noa',
    name: "נועה בן דוד",
    image: "/influencers/noa.jpg",
    baseSalary: 3000,
    coupons: [
      { brand: 'velour', code: 'noa10' },
      { brand: 'labura', code: 'noa15' },
      { brand: 'libero', code: 'noa10' }
    ]
  },
  shoam: {
    id: 'shoam',
    name: "שוהם ביטון",
    image: "/influencers/shoam.jpg",
    coupons: [
      { brand: 'labura', code: 'shoam15' },
      { brand: 'velour', code: 'shoam10' }
    ]
  },
  liya: {
    id: 'liya',
    name: "ליה מזרחי",
    image: "/influencers/liya.jpg",
    baseSalary: 2500,
    coupons: [
      { brand: 'labura', code: 'liya15' }
    ]
  },
  shaked: {
    id: 'shaked',
    name: "שקד לנקרי",
    image: "/influencers/shaked.png",
    coupons: [
      { brand: 'labura', code: 'shaked15' }
    ]
  },
  hf: {
    id: 'hf',
    name: "הדר פדידה",
    image: "/influencers/hf.png",
    coupons: [
      { brand: 'labura', code: 'hf15' }
    ]
  },
  lian: {
    id: 'lian',
    name: "ליאן שיפמן",
    image: "/influencers/lian.jpg",
    coupons: [
      { brand: 'labura', code: 'lian15' }
    ]
  },
  reut: {
    id: 'reut',
    name: "ראות סטרולוביץ",
    image: "/influencers/reut.jpg",
    coupons: [
      { brand: 'labura', code: 'reut' }
    ]
  },
  liz: {
    id: 'liz',
    name: "ליז",
    coupons: [
      { brand: 'libero', code: 'laty10' },
      { brand: 'libero', code: 'laty' }
    ]
  },
  yahav: {
    id: 'yahav',
    name: "יהב",
    coupons: [
      { brand: 'libero', code: 'yahav10' }
    ]
  },
  oded: {
    id: 'oded',
    name: "עודד אלמקייס",
    image: "/oded.png",
    baseSalary: 11000,
    coupons: [
      { brand: 'libero', code: 'osvr10' }
    ]
  },
  orika: {
    id: 'orika',
    name: "אמא פלסטיק ואוריקה",
    coupons: [
      { brand: 'velour', code: 'orika' },
      { brand: 'labura', code: 'orika' },
      { brand: 'libero', code: 'orika' }
    ]
  },
  efrat: {
    id: 'efrat',
    name: "אפרת סביר",
    image: "/influencers/efrat.jpg",
    hasVat: false,
    coupons: [
      { brand: 'velour', code: 'efrat10' },
      { brand: 'labura', code: 'efrat10' },
      { brand: 'libero', code: 'efrat10' }
    ]
  }
};

export const getInfluencerById = (id: string): InfluencerConfig | undefined => {
  return influencersConfig[id];
};
