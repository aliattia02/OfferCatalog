// src/services/searchService.ts - Comprehensive Search Service
import { getAllOffers, OfferWithCatalogue } from './offerService';
import { getCategoryById, getMainCategories, getMainSubcategories } from '../data/categories';
import type { Catalogue, Category, Store } from '../types';

export interface SearchResult {
  id: string;
  type: 'catalogue' | 'offer' | 'subcategory' | 'store'; // Added 'store'
  title: string;
  subtitle?: string;
  imageUrl?: string;
  data: Catalogue | OfferWithCatalogue | Category | Store; // Added Store
  matchScore: number; // For ranking results
}

/**
 * Normalize Arabic text for better search matching
 * Removes diacritics and normalizes characters
 */
const normalizeArabicText = (text: string): string => {
  if (!text) return '';

  return text
    .toLowerCase()
    .trim()
    // Remove Arabic diacritics
    .replace(/[\u064B-\u065F]/g, '')
    // Normalize Alef variations
    .replace(/[آأإ]/g, 'ا')
    // Normalize Teh Marbuta
    .replace(/ة/g, 'ه')
    // Normalize Yeh variations
    .replace(/ى/g, 'ي');
};

/**
 * Calculate match score based on how well the search query matches the text
 */
const calculateMatchScore = (text: string, query: string): number => {
  const normalizedText = normalizeArabicText(text);
  const normalizedQuery = normalizeArabicText(query);

  if (!normalizedQuery) return 0;

  // Exact match
  if (normalizedText === normalizedQuery) return 100;

  // Starts with query
  if (normalizedText.startsWith(normalizedQuery)) return 90;

  // Contains query as whole word
  const words = normalizedText.split(/\s+/);
  if (words.some(word => word === normalizedQuery)) return 80;

  // Contains query at start of any word
  if (words.some(word => word.startsWith(normalizedQuery))) return 70;

  // Contains query anywhere
  if (normalizedText.includes(normalizedQuery)) return 60;

  // Partial word matches
  const queryWords = normalizedQuery.split(/\s+/);
  const matchingWords = queryWords.filter(qWord =>
    words.some(tWord => tWord.includes(qWord))
  );

  if (matchingWords.length > 0) {
    return 50 * (matchingWords.length / queryWords.length);
  }

  return 0;
};

/**
 * Search catalogues by name/title
 * Minimum 3 characters required
 */
export const searchCatalogues = async (
  catalogues: Catalogue[],
  stores: any[],
  query: string
): Promise<SearchResult[]> => {
  if (!query || query.trim().length < 3) return [];

  const results: SearchResult[] = [];

  catalogues.forEach(catalogue => {
    const store = stores.find(s => s.id === catalogue.storeId);
    const storeName = store?.nameAr || '';

    // Search in catalogue title
    const titleScore = calculateMatchScore(catalogue.titleAr, query);

    // Search in store name
    const storeScore = calculateMatchScore(storeName, query);

    const maxScore = Math.max(titleScore, storeScore);

    if (maxScore > 0) {
      results.push({
        id: catalogue.id,
        type: 'catalogue',
        title: storeName,
        subtitle: `${catalogue.startDate} - ${catalogue.endDate}`,
        imageUrl: catalogue.coverImage,
        data: catalogue,
        matchScore: maxScore,
      });
    }
  });

  return results.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Search offers by name
 * Minimum 3 characters required
 */
export const searchOffers = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.trim().length < 3) return [];

  const allOffers = await getAllOffers();
  const results: SearchResult[] = [];

  allOffers.forEach(offer => {
    // Search in Arabic name
    const nameArScore = calculateMatchScore(offer.nameAr, query);

    // Search in English name
    const nameEnScore = offer.nameEn
      ? calculateMatchScore(offer.nameEn, query)
      : 0;

    const maxScore = Math.max(nameArScore, nameEnScore);

    if (maxScore > 0) {
      results.push({
        id: offer.id,
        type: 'offer',
        title: offer.nameAr,
        subtitle: `${offer.storeName} • ${offer.offerPrice} جنيه`,
        imageUrl: offer.imageUrl,
        data: offer,
        matchScore: maxScore,
      });
    }
  });

  return results.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Search stores by name
 * Minimum 3 characters required
 */
export const searchStores = (
  stores: Store[],
  query: string
): SearchResult[] => {
  if (!query || query.trim().length < 3) return [];

  const results: SearchResult[] = [];

  stores.forEach(store => {
    // Search in Arabic name
    const nameArScore = calculateMatchScore(store.nameAr, query);

    // Search in English name
    const nameEnScore = store.nameEn
      ? calculateMatchScore(store.nameEn, query)
      : 0;

    const maxScore = Math.max(nameArScore, nameEnScore);

    if (maxScore > 0) {
      results.push({
        id: store.id,
        type: 'store',
        title: store.nameAr,
        subtitle: `${store.branches.length} ${store.branches.length === 1 ? 'فرع' : 'فروع'}`,
        imageUrl: store.logo,
        data: store,
        matchScore: maxScore,
      });
    }
  });

  return results.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Search subcategories by name
 * Minimum 3 characters required
 */
export const searchSubcategories = (query: string): SearchResult[] => {
  if (!query || query.trim().length < 3) return [];

  const allSubcategories = getMainSubcategories();
  const results: SearchResult[] = [];

  allSubcategories.forEach(subcategory => {
    // Search in Arabic name
    const nameArScore = calculateMatchScore(subcategory.nameAr, query);

    // Search in English name
    const nameEnScore = calculateMatchScore(subcategory.nameEn, query);

    const maxScore = Math.max(nameArScore, nameEnScore);

    if (maxScore > 0) {
      // Get parent category name
      const parentCategory = subcategory.parentId
        ? getCategoryById(subcategory.parentId)
        : null;

      results.push({
        id: subcategory.id,
        type: 'subcategory',
        title: subcategory.nameAr,
        subtitle: parentCategory ? `${parentCategory.nameAr}` : undefined,
        data: subcategory,
        matchScore: maxScore,
      });
    }
  });

  return results.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Comprehensive search across all types
 * Minimum 3 characters required
 */
export const searchAll = async (
  catalogues: Catalogue[],
  stores: Store[],
  query: string
): Promise<{
  catalogues: SearchResult[];
  offers: SearchResult[];
  subcategories: SearchResult[];
  stores: SearchResult[];
  all: SearchResult[];
}> => {
  if (!query || query.trim().length < 3) {
    return {
      catalogues: [],
      offers: [],
      subcategories: [],
      stores: [],
      all: [],
    };
  }

  // Run all searches in parallel
  const [catalogueResults, offerResults, subcategoryResults, storeResults] = await Promise.all([
    searchCatalogues(catalogues, stores, query),
    searchOffers(query),
    Promise.resolve(searchSubcategories(query)),
    Promise.resolve(searchStores(stores, query)),
  ]);

  // Combine all results
  const allResults = [
    ...catalogueResults,
    ...offerResults,
    ...subcategoryResults,
    ...storeResults,
  ].sort((a, b) => b.matchScore - a.matchScore);

  return {
    catalogues: catalogueResults,
    offers: offerResults,
    subcategories: subcategoryResults,
    stores: storeResults,
    all: allResults,
  };
};

/**
 * Get search suggestions (top results for quick display)
 */
export const getSearchSuggestions = async (
  catalogues: Catalogue[],
  stores: any[],
  query: string,
  limit: number = 5
): Promise<SearchResult[]> => {
  const results = await searchAll(catalogues, stores, query);
  return results.all.slice(0, limit);
};