// src/services/offerService.ts
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CatalogueOffer } from './catalogueOfferService';

export interface OfferWithCatalogue extends CatalogueOffer {
  catalogueId: string;
  storeId: string;
  storeName: string;
  catalogueTitle: string;
  catalogueStartDate: string;
  catalogueEndDate: string;
  isActive: boolean;
}

// Get all active offers (catalogues that are currently valid)
export async function getActiveOffers(): Promise<OfferWithCatalogue[]> {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const q = query(
    collection(db, 'offers'),
    where('catalogueEndDate', '>=', now)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as OfferWithCatalogue))
    .filter(offer => offer.catalogueStartDate <= now); // Client-side filter for start date
}

// Get offers by catalogue
export async function getOffersByCatalogue(catalogueId: string): Promise<OfferWithCatalogue[]> {
  const q = query(
    collection(db, 'offers'),
    where('catalogueId', '==', catalogueId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfferWithCatalogue));
}

// Get offers by category (active only)
export async function getOffersByCategory(categoryId: string): Promise<OfferWithCatalogue[]> {
  const now = new Date().toISOString().split('T')[0];

  const q = query(
    collection(db, 'offers'),
    where('categoryId', '==', categoryId),
    where('catalogueEndDate', '>=', now)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as OfferWithCatalogue))
    .filter(offer => offer.catalogueStartDate <= now);
}

// Get offers by store (active only)
export async function getOffersByStore(storeId: string): Promise<OfferWithCatalogue[]> {
  const now = new Date().toISOString().split('T')[0];

  const q = query(
    collection(db, 'offers'),
    where('storeId', '==', storeId),
    where('catalogueEndDate', '>=', now)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as OfferWithCatalogue))
    .filter(offer => offer.catalogueStartDate <= now);
}

// Get single offer by ID
export async function getOfferById(offerId: string): Promise<OfferWithCatalogue | null> {
  const docRef = doc(db, 'offers', offerId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as OfferWithCatalogue;
  }
  return null;
}