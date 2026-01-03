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
  pdfUrl?: string; // NEW: URL to PDF file
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
  unit?: string;
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
}

// Settings
export interface AppSettings {
  language: 'ar' | 'en';
  notificationsEnabled: boolean;
  favoriteStoreIds: string[];
  favoriteOfferIds: string[];
}

// User Profile
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  createdAt: any; // Firebase FieldValue (serverTimestamp) - will be Timestamp after write
  lastLoginAt: any; // Firebase FieldValue (serverTimestamp) - will be Timestamp after write
}

// Auth State
export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
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

// PDF Page Viewer Props
export interface PDFPageViewerProps {
  pdfUrl: string;
  catalogueTitle: string;
  catalogueId: string;
  visible: boolean;
  onClose: () => void;
  onSavePage?: (pageNumber: number, pageImageUri: string) => void;
  savedPages?: number[]; // Already saved page numbers
}

// PDF Page Data
export interface PageData {
  pageNumber: number;
  imageDataUrl: string; // Base64 or URI
  width: number;
  height: number;
}

// Root State
export interface RootState {
  basket: BasketState;
  favorites: FavoritesState;
  offers: OffersState;
  stores: StoresState;
  settings: SettingsState;
  auth: AuthState;
}