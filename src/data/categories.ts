import type { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'food-beverages',
    nameAr: 'طعام ومشروبات',
    nameEn: 'Food & Beverages',
    icon: 'fast-food',
  },
  {
    id: 'dairy',
    nameAr: 'ألبان',
    nameEn: 'Dairy',
    icon: 'water',
    parentId: 'food-beverages',
  },
  {
    id: 'meat-poultry',
    nameAr: 'لحوم ودواجن',
    nameEn: 'Meat & Poultry',
    icon: 'restaurant',
    parentId: 'food-beverages',
  },
  {
    id: 'oils-ghee',
    nameAr: 'زيوت وسمن',
    nameEn: 'Oils & Ghee',
    icon: 'beaker',
    parentId: 'food-beverages',
  },
  {
    id: 'rice-grains',
    nameAr: 'أرز وحبوب',
    nameEn: 'Rice & Grains',
    icon: 'leaf',
    parentId: 'food-beverages',
  },
  {
    id: 'beverages',
    nameAr: 'مشروبات',
    nameEn: 'Beverages',
    icon: 'cafe',
    parentId: 'food-beverages',
  },
  {
    id: 'household',
    nameAr: 'منزلية',
    nameEn: 'Household',
    icon: 'home',
  },
  {
    id: 'personal-care',
    nameAr: 'عناية شخصية',
    nameEn: 'Personal Care',
    icon: 'body',
  },
  {
    id: 'electronics',
    nameAr: 'إلكترونيات',
    nameEn: 'Electronics',
    icon: 'phone-portrait',
  },
  {
    id: 'baby-products',
    nameAr: 'منتجات أطفال',
    nameEn: 'Baby Products',
    icon: 'happy',
  },
];

export const getMainCategories = (): Category[] => {
  return categories.filter(cat => !cat.parentId);
};

export const getSubCategories = (parentId: string): Category[] => {
  return categories.filter(cat => cat.parentId === parentId);
};

export const getCategoryById = (id: string): Category | undefined => {
  return categories.find(cat => cat.id === id);
};

export default categories;
