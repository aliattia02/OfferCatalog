// src/types/index.ts - COMPLETE UPDATED VERSION

import { Timestamp } from 'firebase/firestore';

/**
 * Category Type - Supports hierarchical structure
 */
export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  color?: string; // For main categories
  parentId?: string; // For subcategories - references main category
}

/**
 * Store Type
 */
export interface Store {
  id: string;
  nameAr: string;
  nameEn: string;
  logo: string;
  branches: StoreBranch[];
}

/**
 * Store Branch Type
 */
export interface StoreBranch {
  id: string;
  storeId: string;
  addressAr: string;
  addressEn: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  openingHours: string;
}

/**
 * Catalogue Page Type
 */
export interface CataloguePage {
  pageNumber: number;
  imageUrl: string;
  offers: Offer[];
}

/**
 * Catalogue Type - UPDATED with categoryId
 */
export interface Catalogue {
  id: string;
  storeId: string;
  storeName?: string;
  categoryId?: string; // Main category ID (one of 4 main categories)
  titleAr: string;
  titleEn: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  pdfUrl?: string;
  pages: CataloguePage[];
  totalPages?: number;
  pdfProcessed?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Offer Type - Base offer structure
 */
export interface Offer {
  id: string;
  storeId: string;
  catalogueId: string;
  categoryId: string; // This is the subcategory ID
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl: string;
  offerPrice: number;
  originalPrice?: number;
  unit?: string;
  pageNumber?: number;
  isActive: boolean;
  // Optional fields that may come from OfferWithCatalogue
  catalogueStartDate?: string;
  catalogueEndDate?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Basket Item Type - COMPLETE WITH ALL REQUIRED FIELDS
 */
export interface BasketItem {
  id: string;
  type: 'offer' | 'page' | 'pdf-page';
  quantity: number;
  storeName: string; // Required for all types
  offerEndDate?: string; // For expiry checking
  offerStartDate?: string; // For validity checking
  addedAt: string; // When item was added to basket

  // For offer items
  offer?: Offer & {
    storeName?: string;
    catalogueTitle?: string;
    catalogueStartDate?: string;
    catalogueEndDate?: string;
  };

  // For page items
  cataloguePage?: {
    catalogueId: string;
    catalogueTitle: string;
    pageNumber: number;
    imageUrl: string;
    storeName?: string;
    offers?: string[]; // Array of offer IDs
  };

  // For PDF page items
  pdfPage?: {
    catalogueId: string;
    catalogueTitle: string;
    storeId: string;
    storeName: string;
    pageNumber: number;
    pageImageUri: string;
    savedAt?: string;
  };
}

/**
 * User Profile Type
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  location?: string;
  preferences?: {
    language: 'ar' | 'en';
    notifications: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Favorites State Type - UPDATED for subcategories
 */
export interface FavoritesState {
  subcategoryIds: string[]; // Changed from offerIds
  storeIds: string[];
  catalogueIds?: string[];
}

/**
 * Auth State Type
 */
export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Stores State Type
 */
export interface StoresState {
  stores: Store[];
  loading: boolean;
  error: string | null;
}

/**
 * Offers State Type
 */
export interface OffersState {
  catalogues: Catalogue[];
  loading: boolean;
  error: string | null;
}

/**
 * Basket State Type
 */
export interface BasketState {
  items: BasketItem[];
  total: number;
}

/**
 * Root State Type (for Redux)
 */
export interface RootState {
  auth: AuthState;
  stores: StoresState;
  offers: OffersState;
  basket: BasketState;
  favorites: FavoritesState;
}

/**
 * Helper Types for Category Filtering
 */
export type MainCategoryId = 'food_groceries' | 'electronics' | 'home' | 'fashion';

export interface CategoryFilter {
  mainCategory?: MainCategoryId;
  subcategory?: string;
}

/**
 * Offer with Catalogue Info (from Firestore flat collection)
 */
export interface OfferWithCatalogueInfo extends Offer {
  storeName: string;
  catalogueTitle: string;
  catalogueStartDate: string;
  catalogueEndDate: string;
}

/**
 * Catalogue with Category Info
 */
export interface CatalogueWithCategory extends Catalogue {
  categoryName?: string;
  categoryNameEn?: string;
}

/**
 * Category Hierarchy Helper Type
 */
export interface CategoryHierarchy {
  main: Category;
  sub?: Category;
}

/**
 * Search/Filter Parameters
 */
export interface OfferSearchParams {
  categoryId?: string;
  storeId?: string;
  catalogueId?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
  isActive?: boolean;
}

/**
 * Catalogue Search Parameters
 */
export interface CatalogueSearchParams {
  storeId?: string;
  categoryId?: string; // Main category ID
  status?: 'active' | 'upcoming' | 'expired';
  startDate?: string;
  endDate?: string;
}