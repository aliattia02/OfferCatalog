// Store
export interface Store {
  id: string;
  nameAr: string;
  nameEn: string;
  logo: string;
  branches: Branch[];
  currentCatalogueId?: string;
}

// Branch
export interface Branch {
  id: string;
  storeId: string;
  addressAr: string;
  addressEn: string;
  governorate: string;
  city: string;
  latitude?: number;
  longitude?: number;
  openingHours: string;
  phone?: string;
}

// Catalogue (Weekly Flyer)
export interface Catalogue {
  id: string;
  storeId: string;
  titleAr: string;
  titleEn: string;
  startDate: string;
  endDate: string;
  coverImage: string;
<<<<<<< HEAD
  pdfUrl?: string; // NEW: URL to PDF file
=======
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
  pages: CataloguePage[];
}

// CataloguePage
export interface CataloguePage {
  id: string;
  catalogueId: string;
  pageNumber: number;
  imageUrl: string;
  offers: string[]; // Offer IDs on this page
}

// Offer
export interface Offer {
  id: string;
  storeId: string;
  catalogueId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  originalPrice?: number;
  offerPrice: number;
  currency: 'EGP';
<<<<<<< HEAD
  unit?: string;
=======
  unit?: string; // kg, piece, pack
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
  categoryId: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  isFeatured?: boolean;
}

// Category
export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  parentId?: string;
}

// BasketItem
export interface BasketItem {
  id: string;
<<<<<<< HEAD
  offerId?: string; // Optional now
  offer?: Offer; // Optional for saved pages
  cataloguePage?: SavedCataloguePage; // NEW: For saved pages
  quantity: number;
  addedAt: string;
  storeName: string;
  offerEndDate: string;
  type: 'offer' | 'page'; // NEW: Distinguish between offers and pages
}

// NEW: Saved Catalogue Page
export interface SavedCataloguePage {
  id: string;
  catalogueId: string;
  catalogueTitle: string;
  pageNumber: number;
  imageUrl: string;
  offerIds: string[];
  savedAt: string;
=======
  offerId: string;
  offer: Offer; // Denormalized for display
  quantity: number;
  addedAt: string;
  storeName: string; // For quick display
  offerEndDate: string; // For quick display
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
}

// Settings
export interface AppSettings {
  language: 'ar' | 'en';
  notificationsEnabled: boolean;
  favoriteStoreIds: string[];
  favoriteOfferIds: string[];
}

// Redux State Types
export interface BasketState {
  items: BasketItem[];
  total: number;
}

export interface FavoritesState {
  storeIds: string[];
  offerIds: string[];
}

export interface OffersState {
  offers: Offer[];
  catalogues: Catalogue[];
  loading: boolean;
  error: string | null;
}

export interface StoresState {
  stores: Store[];
  selectedStoreId: string | null;
  loading: boolean;
  error: string | null;
}

export interface SettingsState {
  language: 'ar' | 'en';
  notificationsEnabled: boolean;
  isRTL: boolean;
}

// Root State
export interface RootState {
  basket: BasketState;
  favorites: FavoritesState;
  offers: OffersState;
  stores: StoresState;
  settings: SettingsState;
<<<<<<< HEAD
}
=======
}
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
