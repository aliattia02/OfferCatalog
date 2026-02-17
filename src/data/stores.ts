// data/stores.ts - COMPLETE VERSION with Default Logo Fallback
import type { Store, Branch } from '../types';
import { storeLogos, getStoreLogo } from '../assets/logoRegistry';

// ============================================
// GOVERNORATE DEFINITIONS
// ============================================
export const GOVERNORATES = {
  SHARKIA: 'sharkia',
  DAKAHLIA: 'dakahlia',
  CAIRO: 'cairo',
  GIZA: 'giza',
  ALEXANDRIA: 'alexandria',
} as const;

export type GovernorateId = typeof GOVERNORATES[keyof typeof GOVERNORATES];

export const governorateNames: Record<GovernorateId, { ar: string; en: string }> = {
  sharkia: { ar: 'الشرقية', en: 'Sharkia' },
  dakahlia: { ar: 'الدقهلية', en: 'Dakahlia' },
  cairo: { ar: 'القاهرة', en: 'Cairo' },
  giza: { ar: 'الجيزة', en: 'Giza' },
  alexandria: { ar: 'الإسكندرية', en: 'Alexandria' },
};

// ============================================
// CITY DEFINITIONS
// ============================================
export const CITIES = {
  // Sharkia
  ZAGAZIG: 'zagazig',
  BILBEIS: 'bilbeis',
  MINYA_QAMH: 'minya_qamh',
  FAKUS: 'fakus',
  ABU_HAMMAD: 'abu_hammad',
  ABU_KABIR: 'abu_kabir',
  HEHIA: 'hehia',
  // Dakahlia
  MANSOURA: 'mansoura',
  TALKHA: 'talkha',
  MIT_GHAMR: 'mit_ghamr',
  BELQAS: 'belqas',
  SHERBIN: 'sherbin',
  // Cairo
  NASR_CITY: 'nasr_city',
  HELIOPOLIS: 'heliopolis',
  MAADI: 'maadi',
  DOWNTOWN: 'downtown',
  SIXTH_OCTOBER: 'sixth_october', // Often mapped to Cairo/Giza metro area
  // Alexandria (NEW)
  ALEXANDRIA_CITY: 'alexandria_city',
  SMOUHA: 'smouha',
  SIDI_GABER: 'sidi_gaber',
  MONTAZAH: 'montazah',
  MOHARRAM_BEY: 'moharram_bey',
} as const;

export type CityId = typeof CITIES[keyof typeof CITIES];

export const cityNames: Record<CityId, { ar: string; en: string; governorate: GovernorateId }> = {
  // Sharkia
  zagazig: { ar: 'الزقازيق', en: 'Zagazig', governorate: 'sharkia' },
  bilbeis: { ar: 'بلبيس', en: 'Bilbeis', governorate: 'sharkia' },
  minya_qamh: { ar: 'منيا القمح', en: 'Minya El Qamh', governorate: 'sharkia' },
  fakus: { ar: 'فاقوس', en: 'Fakus', governorate: 'sharkia' },
  abu_hammad: { ar: 'أبو حماد', en: 'Abu Hammad', governorate: 'sharkia' },
  abu_kabir: { ar: 'أبو كبير', en: 'Abu Kabir', governorate: 'sharkia' },
  hehia: { ar: 'ههيا', en: 'Hehia', governorate: 'sharkia' },
  // Dakahlia
  mansoura: { ar: 'المنصورة', en: 'Mansoura', governorate: 'dakahlia' },
  talkha: { ar: 'طلخا', en: 'Talkha', governorate: 'dakahlia' },
  mit_ghamr: { ar: 'ميت غمر', en: 'Mit Ghamr', governorate: 'dakahlia' },
  belqas: { ar: 'بلقاس', en: 'Belqas', governorate: 'dakahlia' },
  sherbin: { ar: 'شربين', en: 'Sherbin', governorate: 'dakahlia' },
  // Cairo
  nasr_city: { ar: 'مدينة نصر', en: 'Nasr City', governorate: 'cairo' },
  heliopolis: { ar: 'مصر الجديدة', en: 'Heliopolis', governorate: 'cairo' },
  maadi: { ar: 'المعادي', en: 'Maadi', governorate: 'cairo' },
  downtown: { ar: 'وسط البلد', en: 'Downtown', governorate: 'cairo' },
  sixth_october: { ar: 'السادس من أكتوبر', en: '6th of October', governorate: 'cairo' },
  // Alexandria
  alexandria_city: { ar: 'الإسكندرية', en: 'Alexandria', governorate: 'alexandria' },
  smouha: { ar: 'سموحة', en: 'Smouha', governorate: 'alexandria' },
  sidi_gaber: { ar: 'سيدي جابر', en: 'Sidi Gaber', governorate: 'alexandria' },
  montazah: { ar: 'المنتزه', en: 'Montazah', governorate: 'alexandria' },
  moharram_bey: { ar: 'محرم بك', en: 'Moharram Bey', governorate: 'alexandria' },
};

// ============================================
// LOCAL STORE NAMES BY GOVERNORATE
// ============================================
export interface LocalStoreName {
  id: string;
  nameAr: string;
  nameEn: string;
  governorate: GovernorateId;
  cities?: CityId[];
}

export const localStoreNames: Record<GovernorateId, LocalStoreName[]> = {
  sharkia: [
    {
      id: 'zahran',
      nameAr: 'زهران',
      nameEn: 'Zahran',
      governorate: 'sharkia',
      cities: ['zagazig'],
    },
    {
      id: 'raya',
      nameAr: 'راية',
      nameEn: 'Raya',
      governorate: 'sharkia',
      cities: ['zagazig'],
    },
    {
      id: 'abouelsaoud',
      nameAr: 'أبو السعود',
      nameEn: 'Abou El Saoud',
      governorate: 'sharkia',
      cities: ['zagazig'],
    },
    {
      id: 'elmohandes',
      nameAr: 'المهندس',
      nameEn: 'El Mohandes',
      governorate: 'sharkia',
      cities: ['zagazig', 'bilbeis'],
    },
    {
      id: 'alnour',
      nameAr: 'النور',
      nameEn: 'Al Nour',
      governorate: 'sharkia',
      cities: ['zagazig', 'fakus'],
    },
  ],
  dakahlia: [
    {
      id: 'mansoura_local_1',
      nameAr: 'سوبر ماركت المنصورة',
      nameEn: 'Mansoura Supermarket',
      governorate: 'dakahlia',
      cities: ['mansoura'],
    },
    {
      id: 'talkha_local_1',
      nameAr: 'متجر طلخا المركزي',
      nameEn: 'Talkha Central Store',
      governorate: 'dakahlia',
      cities: ['talkha'],
    },
  ],
  cairo: [
    {
      id: 'cairo_local_1',
      nameAr: 'سوبر ماركت القاهرة',
      nameEn: 'Cairo Supermarket',
      governorate: 'cairo',
      cities: ['nasr_city', 'heliopolis'],
    },
    {
      id: 'maadi_local_1',
      nameAr: 'متجر المعادي',
      nameEn: 'Maadi Store',
      governorate: 'cairo',
      cities: ['maadi'],
    },
  ],
  giza: [],
  alexandria: [],
};

// ============================================
// HELPER FUNCTIONS FOR LOCAL STORE NAMES
// ============================================

export const getLocalStoreNamesByGovernorate = (governorate: GovernorateId): LocalStoreName[] => {
  return localStoreNames[governorate] || [];
};

export const getLocalStoreNamesByCity = (governorate: GovernorateId, city?: CityId): LocalStoreName[] => {
  const allStores = localStoreNames[governorate] || [];

  if (!city) {
    return allStores;
  }

  return allStores.filter(store => {
    if (!store.cities || store.cities.length === 0) {
      return true;
    }
    return store.cities.includes(city);
  });
};

export const getLocalStoreNameById = (id: string, governorate: GovernorateId): LocalStoreName | undefined => {
  const stores = localStoreNames[governorate] || [];
  return stores.find(store => store.id === id);
};

// ============================================
// HELPER FUNCTIONS FOR LOCATION
// ============================================

export const getCitiesByGovernorate = (governorateId: GovernorateId): CityId[] => {
  return Object.keys(cityNames).filter(
    cityId => cityNames[cityId as CityId].governorate === governorateId
  ) as CityId[];
};

export const getGovernorateName = (governorateId: GovernorateId, lang: 'ar' | 'en' = 'ar'): string => {
  return governorateNames[governorateId]?.[lang] || governorateId;
};

export const getCityName = (cityId: CityId, lang: 'ar' | 'en' = 'ar'): string => {
  return cityNames[cityId]?.[lang] || cityId;
};

export const getCityGovernorate = (cityId: CityId): GovernorateId => {
  return cityNames[cityId]?.governorate;
};

// ============================================
// STORES DATA
// ============================================

export const stores: Store[] = [
  // MULTI-CATEGORY STORES
  {
    id: 'carrefour',
    nameAr: 'كارفور',
    nameEn: 'Carrefour',
    logo: getStoreLogo('carrefour'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },
  {
    id: 'hyperone',
    nameAr: 'هايبر وان',
    nameEn: 'HyperOne',
    logo: getStoreLogo('hyperone'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },
  {
    id: 'kazyon',
    nameAr: 'كازيون',
    nameEn: 'Kazyon',
    logo: getStoreLogo('kazyon'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },
  {
    id: 'awladragab',
    nameAr: 'أولاد رجب',
    nameEn: 'Awlad Ragab',
    logo: getStoreLogo('awladragab'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },

  // FOOD-FOCUSED STORES
  {
    id: 'metro',
    nameAr: 'مترو',
    nameEn: 'Metro',
    logo: getStoreLogo('metro'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },
  {
    id: 'spinneys',
    nameAr: 'سبينيس',
    nameEn: 'Spinneys',
    logo: getStoreLogo('spinneys'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },
  {
    id: 'seoudi',
    nameAr: 'سعودي',
    nameEn: 'Seoudi',
    logo: getStoreLogo('seoudi'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },
  {
    id: 'kheirzaman',
    nameAr: 'خير زمان',
    nameEn: 'Kheir Zaman',
    logo: getStoreLogo('kheirzaman'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },
  {
    id: 'fathalla',
    nameAr: 'فتح الله',
    nameEn: 'Fathalla',
    logo: getStoreLogo('fathalla'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },
  {
    id: 'bim',
    nameAr: 'بيم',
    nameEn: 'BIM',
    logo: getStoreLogo('bim'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },
  {
    id: 'gomla',
    nameAr: 'جملة ماركت',
    nameEn: 'Gomla Market',
    logo: getStoreLogo('gomla'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },
  {
    id: 'pandah',
    nameAr: 'باندا ماركت',
    nameEn: 'Pandah Market',
    logo: getStoreLogo('pandah'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },

  // ELECTRONICS STORES
  {
    id: 'btech',
    nameAr: 'بي تك',
    nameEn: 'B.TECH',
    logo: getStoreLogo('btech'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },
  {
    id: 'oscar',
    nameAr: 'أوسكار',
    nameEn: 'Oscar',
    logo: getStoreLogo('oscar'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },
  {
    id: 'extra',
    nameAr: 'إكسترا',
    nameEn: 'eXtra',
    logo: getStoreLogo('extra'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    branches: [],
  },

  // LOCAL STORES - BY GOVERNORATE
  {
    id: 'sharkia_local',
    nameAr: 'متاجر الشرقية',
    nameEn: 'Sharkia Local Stores',
    logo: getStoreLogo('sharkia_local'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    isLocal: true,
    governorate: 'sharkia',
    branches: [],
  },
  {
    id: 'dakahlia_local',
    nameAr: 'متاجر الدقهلية',
    nameEn: 'Dakahlia Local Stores',
    logo: getStoreLogo('dakahlia_local'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    isLocal: true,
    governorate: 'dakahlia',
    branches: [],
  },
  {
    id: 'cairo_local',
    nameAr: 'متاجر القاهرة',
    nameEn: 'Cairo Local Stores',
    logo: getStoreLogo('cairo_local'),
    categories: ['general', 'food_groceries', 'electronics', 'home', 'fashion'],
    isLocal: true,
    governorate: 'cairo',
    branches: [],
  },
];

// ============================================
// BRANCHES DATA (Organized by Governorate)
// ============================================

export const sharkiaBranches: Branch[] = [
  // Carrefour Zagazig - VERIFIED LOCATION
  {
    id: 'carrefour-zagazig-1',
    storeId: 'carrefour',
    addressAr: 'شارع القوميه - الزقازيق، الشرقيه',
    addressEn: 'Kawmia Street - Zagazig Rd, Shaibet an Nakareyah',
    governorate: 'sharkia',
    city: 'zagazig',
    latitude: 30.590486,
    longitude: 31.489913,
    openingHours: '09:00 AM - 12:00 AM', //
    phone: '16061',
  },
  {
    id: 'btech-zagazig-1',
    storeId: 'btech',
    addressAr: 'شارع المحافظة، برج صيدناوي، أمام مبنى المحافظة، الزقازيق',
    addressEn: 'Al-Mohafaza St, Sidanawy Tower, in front of the Governorate Building, Zagazig',
    governorate: 'sharkia',
    city: 'zagazig',
    latitude: 30.5882,
    longitude: 31.5015,
    openingHours: '10:00 AM - 10:00 PM', //
    phone: '19966',
  },
  {
    id: 'kazyon-zagazig-1',
    storeId: 'kazyon',
    addressAr: 'شارع الجلاء، الزقازيق، الشرقية',
    addressEn: 'Al-Galaa St, Zagazig, Sharqia',
    governorate: 'sharkia',
    city: 'zagazig',
    latitude: 30.5833,
    longitude: 31.5167,
    openingHours: '09:00 AM - 01:00 AM',
    phone: '19600',
  },
  // LOCAL STORES (Kept as originally requested if valid, else can be trimmed)
  {
    id: 'zahran-zagazig-galaa',
    storeId: 'sharkia_local',
    storeName: 'زهران',
    storeNameEn: 'Zahran',
    addressAr: 'شارع الجلاء، الزقازيق، الشرقية',
    addressEn: 'El-Galaa Street, Zagazig, Sharqia',
    governorate: 'sharkia',
    city: 'zagazig',
    latitude: 30.5880,
    longitude: 31.5025,
    openingHours: '8:00 ص - 12:00 ص',
    phone: '+20552365400',
  },
  {
    id: 'abouelsaoud-zagazig-hosseiny',
    storeId: 'sharkia_local',
    storeName: 'أبو السعود',
    storeNameEn: 'Abou El Saoud',
    addressAr: 'شارع الحسيني، الزقازيق، الشرقية',
    addressEn: 'El-Hosseiny Street, Zagazig, Sharqia',
    governorate: 'sharkia',
    city: 'zagazig',
    latitude: 30.5870,
    longitude: 31.5040,
    openingHours: '9:00 ص - 11:00 م',
    phone: '+20552667788',
  },
];

export const dakahliaBranches: Branch[] = [
  {
    id: 'carrefour-mansoura-1',
    storeId: 'carrefour',
    addressAr: 'المنصورة قسم 2، شارع الجمهورية، الدقهلية',
    addressEn: 'Mansoura Qism 2, El Gomhouria St, Dakahlia',
    governorate: 'dakahlia',
    city: 'mansoura',
    latitude: 31.0409,
    longitude: 31.3785,
    openingHours: '09:00 AM - 01:00 AM', //
    phone: '16061',
  },
  {
    id: 'btech-mansoura-1',
    storeId: 'btech',
    addressAr: 'شارع بورسعيد، بجوار مسجد الصالح الصغير، مبنى التصنيع القديم',
    addressEn: 'Port Said St, next to Al-Saleh Small Mosque, Old Manufacturing Building',
    governorate: 'dakahlia',
    city: 'mansoura',
    latitude: 31.0450,
    longitude: 31.3850,
    openingHours: '10:00 AM - 10:00 PM', //
    phone: '19966',
  },
  {
    id: 'kazyon-mansoura-1',
    storeId: 'kazyon',
    addressAr: 'شارع الإمام أحمد عبده، متفرع من كلية الآداب، حي غرب',
    addressEn: 'El Emam Ahmed Abdou St, Off Koleyet El Adaab St, West District',
    governorate: 'dakahlia',
    city: 'mansoura',
    latitude: 31.0360,
    longitude: 31.3680,
    openingHours: '09:00 AM - 01:00 AM', //
    phone: '19600',
  },
];

export const cairoBranches: Branch[] = [
  {
    id: 'carrefour-cairo-almaza',
    storeId: 'carrefour',
    addressAr: 'سيتي سنتر ألماظة، طريق السويس، هليوبوليس، القاهرة',
    addressEn: 'City Centre Almaza, Suez Rd, Heliopolis, Cairo',
    governorate: 'cairo',
    city: 'heliopolis',
    latitude: 30.0980,
    longitude: 31.3630,
    openingHours: '10:00 AM - 12:00 AM', //
    phone: '16061',
  },
  {
    id: 'btech-cairo-nasr',
    storeId: 'btech',
    addressAr: '4 طريق النصر، مكرم عبيد، المنطقة السادسة، مدينة نصر',
    addressEn: '4 El-Nasr Rd, Makram Ebeid, District 6, Nasr City',
    governorate: 'cairo',
    city: 'nasr_city',
    latitude: 30.0590,
    longitude: 31.3380,
    openingHours: '10:00 AM - 11:00 PM', //
    phone: '19966',
  },
  {
    id: 'hyperone-cairo-zayed',
    storeId: 'hyperone',
    addressAr: 'مدخل 1 مدينة الشيخ زايد، محور 26 يوليو، 6 أكتوبر',
    addressEn: 'Entrance 1 Sheikh Zayed City, 26th of July Corridor, 6th of October',
    governorate: 'cairo',
    city: 'sixth_october',
    latitude: 30.0150,
    longitude: 30.9850,
    openingHours: '08:00 AM - 11:00 PM', //
    phone: '16400',
  },
];

export const alexandriaBranches: Branch[] = [
  {
    id: 'carrefour-alex-citycenter',
    storeId: 'carrefour',
    addressAr: 'كارفور سيتي سنتر، بوابة 4، طريق الإسكندرية الصحراوي، الكيلو 8',
    addressEn: 'Carrefour City Center, Gate 4, Alex-Cairo Desert Rd, Km 8',
    governorate: 'alexandria',
    city: 'alexandria_city',
    latitude: 31.1550,
    longitude: 29.9550,
    openingHours: '09:00 AM - 12:00 AM', //
    phone: '16061',
  },
  {
    id: 'spinneys-alex-smouha',
    storeId: 'spinneys',
    addressAr: '364 شارع النقل والهندسة، سموحة، بجوار نادي سموحة',
    addressEn: '364 El Naql & El Handasa St., Semouha, Next to Smouha Club',
    governorate: 'alexandria',
    city: 'smouha',
    latitude: 31.2150,
    longitude: 29.9450,
    openingHours: '09:00 AM - 01:00 AM', //
    phone: '16005',
  },
  {
    id: 'btech-alex-sidi-gaber',
    storeId: 'btech',
    addressAr: '305 شارع بورسعيد، سيدي جابر، أمام مستشفى القوات المسلحة',
    addressEn: '305 Port Said St., Sidi Gaber, In front of Armed Forces Hospital',
    governorate: 'alexandria',
    city: 'sidi_gaber',
    latitude: 31.2200,
    longitude: 29.9420,
    openingHours: '10:00 AM - 10:00 PM', //
    phone: '19966',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getStoreById = (storeId: string): Store | undefined => {
  return stores.find(s => s.id === storeId);
};

export const getBranchesByStore = (storeId: string): Branch[] => {
  const allBranches = [...sharkiaBranches, ...dakahliaBranches, ...cairoBranches, ...alexandriaBranches];
  return allBranches.filter(b => b.storeId === storeId);
};

export const getBranchesByGovernorate = (governorate: GovernorateId): Branch[] => {
  switch (governorate) {
    case 'sharkia':
      return sharkiaBranches;
    case 'dakahlia':
      return dakahliaBranches;
    case 'cairo':
      return cairoBranches;
    case 'alexandria':
      return alexandriaBranches;
    default:
      return [];
  }
};

export const getBranchesByCity = (cityId: CityId): Branch[] => {
  const allBranches = [...sharkiaBranches, ...dakahliaBranches, ...cairoBranches, ...alexandriaBranches];
  return allBranches.filter(b => b.city === cityId);
};

export const getBranchesByUserLocation = (
  governorate: GovernorateId,
  city?: CityId
): Branch[] => {
  const governorateBranches = getBranchesByGovernorate(governorate);

  if (city) {
    return governorateBranches.filter(b => b.city === city);
  }

  return governorateBranches;
};

export const getStoresByUserLocation = (
  governorate: GovernorateId,
  city?: CityId
): Store[] => {
  const branches = getBranchesByUserLocation(governorate, city);
  const storeIds = new Set(branches.map(b => b.storeId));

  return stores
    .filter(s => storeIds.has(s.id))
    .map(store => ({
      ...store,
      branches: branches.filter(b => b.storeId === store.id),
    }));
};

export const getAllBranches = (): Branch[] => {
  return [...sharkiaBranches, ...dakahliaBranches, ...cairoBranches, ...alexandriaBranches];
};

export const getStoresByCategory = (categoryId: string): Store[] => {
  return stores.filter(s => s.categories?.includes(categoryId));
};

export const getNationalStores = (): Store[] => {
  return stores.filter(s => !s.isLocal);
};

export const getLocalStoresByGovernorate = (governorate?: GovernorateId): Store[] => {
  if (governorate) {
    return stores.filter(s => s.isLocal && s.governorate === governorate);
  }
  return stores.filter(s => s.isLocal);
};

export const searchStores = (query: string): Store[] => {
  const lowerQuery = query.toLowerCase();
  return stores.filter(
    s =>
      s.nameAr.toLowerCase().includes(lowerQuery) ||
      s.nameEn.toLowerCase().includes(lowerQuery)
  );
};

export const getBranchCountText = (
  count: number,
  governorate?: GovernorateId
): string => {
  if (count === 0) return 'لا توجد فروع';
  if (count === 1) return 'فرع واحد';
  if (count === 2) return 'فرعان';

  const governorateText = governorate
    ? ` في ${getGovernorateName(governorate)}`
    : '';

  return `${count} فروع${governorateText}`;
};

export default stores;