// src/services/offerService.ts - FIXED DATE COMPARISON WITH EGYPT TIMEZONE
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CatalogueOffer } from './catalogueOfferService';
import { getTodayString, normalizeDateString } from '../utils/dateUtils';

export interface OfferWithCatalogue extends CatalogueOffer {
  catalogueId: string;
  storeId: string;
  storeName: string;
  catalogueTitle: string;
  catalogueStartDate: string;
  catalogueEndDate: string;
  isActive: boolean;
}

/**
 * Check if an offer is currently active based on catalogue dates
 */
const isOfferActive = (startDate: string, endDate: string): boolean => {
  const today = getTodayString();

  // Normalize dates to YYYY-MM-DD format with zero-padding
  const normalizedStart = normalizeDateString(startDate);
  const normalizedEnd = normalizeDateString(endDate);

  // Check if active
  const startOk = normalizedStart <= today;
  const endOk = normalizedEnd >= today;
  const isActive = startOk && endOk;

  console.log(`📅 Active check: start=${normalizedStart} ${startOk ? '✓' : '✗'} | today=${today} | end=${normalizedEnd} ${endOk ? '✓' : '✗'} = ${isActive ? 'ACTIVE' : 'NOT ACTIVE'}`);

  return isActive;
};

// Get ALL offers (no filtering - use sparingly, only when user explicitly wants to see all/expired/upcoming)
export async function getAllOffers(): Promise<OfferWithCatalogue[]> {
  console.log('📦 getAllOffers: Fetching all offers...');
  const snapshot = await getDocs(collection(db, 'offers'));
  const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfferWithCatalogue));
  console.log(`📦 getAllOffers: Found ${offers.length} total offers`);
  return offers;
}

// Get all active offers (catalogues that are currently valid)
export async function getActiveOffers(): Promise<OfferWithCatalogue[]> {
  const today = getTodayString();

  console.log(`📦 getActiveOffers: Fetching active offers for date: ${today}`);

  // Query offers where catalogue end date is >= today
  const q = query(
    collection(db, 'offers'),
    where('catalogueEndDate', '>=', today)
  );

  const snapshot = await getDocs(q);
  const allOffers = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as OfferWithCatalogue));

  console.log(`📦 getActiveOffers: Found ${allOffers.length} offers with endDate >= ${today}`);

  // Filter for offers where start date is also <= today
  const activeOffers = allOffers.filter(offer => {
    const isActive = isOfferActive(offer.catalogueStartDate, offer.catalogueEndDate);

    if (!isActive) {
      console.log(`⏭️  Skipping offer ${offer.id}: ${offer.catalogueStartDate} to ${offer.catalogueEndDate}`);
    } else {
      console.log(`✅ Active offer ${offer.id}: ${offer.nameAr}`);
    }

    return isActive;
  });

  console.log(`📦 getActiveOffers: Returning ${activeOffers.length} active offers`);
  return activeOffers;
}

// Get offers by catalogue
export async function getOffersByCatalogue(catalogueId: string): Promise<OfferWithCatalogue[]> {
  console.log(`📦 getOffersByCatalogue: Fetching offers for catalogue ${catalogueId}`);

  const q = query(
    collection(db, 'offers'),
    where('catalogueId', '==', catalogueId)
  );

  const snapshot = await getDocs(q);
  const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfferWithCatalogue));

  console.log(`📦 getOffersByCatalogue: Found ${offers.length} offers`);
  return offers;
}

// Get offers by category (active only by default)
export async function getOffersByCategory(categoryId: string, activeOnly: boolean = true): Promise<OfferWithCatalogue[]> {
  console.log(`📦 getOffersByCategory: category=${categoryId}, activeOnly=${activeOnly}`);

  if (!activeOnly) {
    // Get all offers for this category
    const q = query(
      collection(db, 'offers'),
      where('categoryId', '==', categoryId)
    );
    const snapshot = await getDocs(q);
    const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfferWithCatalogue));
    console.log(`📦 getOffersByCategory: Found ${offers.length} total offers for category`);
    return offers;
  }

  // Get only active offers
  const today = getTodayString();
  const q = query(
    collection(db, 'offers'),
    where('categoryId', '==', categoryId),
    where('catalogueEndDate', '>=', today)
  );

  const snapshot = await getDocs(q);
  const allOffers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfferWithCatalogue));

  // Filter for active offers
  const activeOffers = allOffers.filter(offer =>
    isOfferActive(offer.catalogueStartDate, offer.catalogueEndDate)
  );

  console.log(`📦 getOffersByCategory: Found ${activeOffers.length} active offers for category`);
  return activeOffers;
}

// Get offers by store (active only by default)
export async function getOffersByStore(storeId: string, activeOnly: boolean = true): Promise<OfferWithCatalogue[]> {
  console.log(`📦 getOffersByStore: store=${storeId}, activeOnly=${activeOnly}`);

  if (!activeOnly) {
    // Get all offers for this store
    const q = query(
      collection(db, 'offers'),
      where('storeId', '==', storeId)
    );
    const snapshot = await getDocs(q);
    const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfferWithCatalogue));
    console.log(`📦 getOffersByStore: Found ${offers.length} total offers for store`);
    return offers;
  }

  // Get only active offers
  const today = getTodayString();
  const q = query(
    collection(db, 'offers'),
    where('storeId', '==', storeId),
    where('catalogueEndDate', '>=', today)
  );

  const snapshot = await getDocs(q);
  const allOffers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfferWithCatalogue));

  // Filter for active offers
  const activeOffers = allOffers.filter(offer =>
    isOfferActive(offer.catalogueStartDate, offer.catalogueEndDate)
  );

  console.log(`📦 getOffersByStore: Found ${activeOffers.length} active offers for store`);
  return activeOffers;
}

// Get single offer by ID
export async function getOfferById(offerId: string): Promise<OfferWithCatalogue | null> {
  console.log(`📦 getOfferById: Fetching offer ${offerId}`);

  const docRef = doc(db, 'offers', offerId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const offer = { id: docSnap.id, ...docSnap.data() } as OfferWithCatalogue;
    console.log(`📦 getOfferById: Found offer ${offer.nameAr}`);
    return offer;
  }

  console.log(`📦 getOfferById: Offer ${offerId} not found`);
  return null;
}