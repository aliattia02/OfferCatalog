import type { Store, Branch } from '../types';

// Kazyon branches in Zagazig
const kazyonBranches: Branch[] = [
  {
    id: 'kazyon-zagazig-1',
    storeId: 'kazyon',
    addressAr: 'شارع الجلاء، الزقازيق، الشرقية',
    addressEn: 'El-Galaa Street, Zagazig, Sharqia',
    governorate: 'sharqia',
    city: 'zagazig',
    latitude: 30.5877,
    longitude: 31.5020,
    openingHours: '8:00 AM - 12:00 AM',
    phone: '+20552365478',
  },
  {
    id: 'kazyon-zagazig-2',
    storeId: 'kazyon',
    addressAr: 'شارع أحمد عرابي، الزقازيق، الشرقية',
    addressEn: 'Ahmed Orabi Street, Zagazig, Sharqia',
    governorate: 'sharqia',
    city: 'zagazig',
    latitude: 30.5912,
    longitude: 31.5045,
    openingHours: '8:00 AM - 12:00 AM',
    phone: '+20552398741',
  },
  {
    id: 'kazyon-zagazig-3',
    storeId: 'kazyon',
    addressAr: 'شارع الشهيد عبد المنعم رياض، الزقازيق، الشرقية',
    addressEn: 'Shaheed Abdel Moneim Riad Street, Zagazig, Sharqia',
    governorate: 'sharqia',
    city: 'zagazig',
    latitude: 30.5845,
    longitude: 31.4985,
    openingHours: '8:00 AM - 11:00 PM',
    phone: '+20552412365',
  },
];

// Carrefour branches in Zagazig
const carrefourBranches: Branch[] = [
  {
    id: 'carrefour-zagazig-1',
    storeId: 'carrefour',
    addressAr: 'مول الزقازيق، طريق الإسماعيلية، الزقازيق، الشرقية',
    addressEn: 'Zagazig Mall, Ismailia Road, Zagazig, Sharqia',
    governorate: 'sharqia',
    city: 'zagazig',
    latitude: 30.5932,
    longitude: 31.5112,
    openingHours: '9:00 AM - 11:00 PM',
    phone: '+20552478965',
  },
  {
    id: 'carrefour-zagazig-2',
    storeId: 'carrefour',
    addressAr: 'شارع سعد زغلول، الزقازيق، الشرقية',
    addressEn: 'Saad Zaghloul Street, Zagazig, Sharqia',
    governorate: 'sharqia',
    city: 'zagazig',
    latitude: 30.5865,
    longitude: 31.5032,
    openingHours: '9:00 AM - 10:00 PM',
    phone: '+20552365987',
  },
];

export const stores: Store[] = [
  {
    id: 'kazyon',
    nameAr: 'كازيون',
    nameEn: 'Kazyon',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Kazyon_logo.png/220px-Kazyon_logo.png',
    branches: kazyonBranches,
    currentCatalogueId: 'kazyon-catalogue-1',
  },
  {
    id: 'carrefour',
    nameAr: 'كارفور',
    nameEn: 'Carrefour',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/220px-Carrefour_logo.svg.png',
    branches: carrefourBranches,
    currentCatalogueId: 'carrefour-catalogue-1',
  },
];

export const getAllBranches = (): Branch[] => {
  return stores.flatMap(store => store.branches);
};

export const getBranchesByCity = (city: string): Branch[] => {
  return getAllBranches().filter(branch => branch.city === city);
};

export const getBranchesByStore = (storeId: string): Branch[] => {
  const store = stores.find(s => s.id === storeId);
  return store ? store.branches : [];
};

export default stores;
