// src/store/slices/basketSlice.ts - WITH HELPER FUNCTION
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { BasketState, BasketItem, Offer, Catalogue, CataloguePage, Branch, Store } from '../../types';
import { normalizeDateString, isDateExpired } from '../../utils/dateUtils';

// ========================================
// 🆕 HELPER FUNCTION - Prepare Basket Context
// ========================================

/**
 * Helper to prepare complete context for adding an offer to basket
 * This ensures all necessary data is included for proper store name display
 */
export interface BasketContext {
  branch?: Branch;
  catalogue?: Catalogue;
  store?: Store;
  storeNameAr?: string;
  storeNameEn?: string;
  localStoreName?: string;
  storeName: string;
}

interface PrepareBasketContextParams {
  offer: Offer;
  stores: Store[];
  catalogues: Catalogue[];
  branches: Branch[];
}

/**
 * Prepares the complete context needed when adding an offer to basket
 *
 * Priority for storeName:
 * 1. branch.storeName (local store like "زهران", "راية")
 * 2. catalogue.titleAr (catalogue with branch info)
 * 3. store.nameAr (chain store name)
 * 4. offer.storeName (fallback)
 *
 * @example
 * ```typescript
 * const context = prepareBasketContext({
 *   offer,
 *   stores: useAppSelector(state => state.stores.stores),
 *   catalogues: useAppSelector(state => state.catalogues.catalogues),
 *   branches: useAppSelector(state => state.branches?.branches || []),
 * });
 *
 * dispatch(addToBasket({
 *   offer: {...offer},
 *   ...context,
 * }));
 * ```
 */
export function prepareBasketContext({
  offer,
  stores,
  catalogues,
  branches,
}: PrepareBasketContextParams): BasketContext {
  // Find related objects
  const store = stores.find(s => s.id === offer.storeId);
  const catalogue = catalogues.find(c => c.id === offer.catalogueId);

  // Find branch - try branchId first, then any branch for this store
  const branch = offer.branchId
    ? branches.find(b => b.id === offer.branchId)
    : branches.find(b => b.storeId === offer.storeId);

  // Determine the best storeName
  let storeName: string;
  if (branch?.storeName) {
    // Local store branch (highest priority)
    storeName = branch.storeName;
  } else if (catalogue?.titleAr) {
    // Catalogue title (often includes branch info)
    storeName = catalogue.titleAr;
  } else if (store?.nameAr) {
    // Chain store name
    storeName = store.nameAr;
  } else {
    // Fallback to offer's storeName
    storeName = offer.storeName || 'Unknown Store';
  }

  console.log('🛒 [prepareBasketContext] Prepared context:', {
    offerId: offer.id,
    offerName: offer.nameAr,
    storeName,
    hasBranch: !!branch,
    branchStoreName: branch?.storeName,
    hasCatalogue: !!catalogue,
    catalogueTitle: catalogue?.titleAr,
    hasStore: !!store,
  });

  return {
    branch,
    catalogue,
    store,
    storeNameAr: store?.nameAr,
    storeNameEn: store?.nameEn,
    localStoreName: branch?.storeName,
    storeName,
  };
}

// ========================================
// Redux Slice
// ========================================

const initialState: BasketState = {
  items: [],
  total: 0,
};

interface AddOfferPayload {
  offer: Offer & {
    catalogueStartDate?: string;
    catalogueEndDate?: string;
    catalogueId?: string;
    catalogueTitle?: string;
  };
  storeName: string;
  // ✅ Optional fields for local store support
  branch?: Branch;
  catalogue?: Catalogue;
  store?: Store;
  storeNameAr?: string;
  storeNameEn?: string;
  localStoreName?: string;
}

interface AddPagePayload {
  catalogue: Catalogue;
  page: CataloguePage;
  storeName: string;
  offers: Offer[];
  // ✅ Optional fields for local store support
  branch?: Branch;
  store?: Store;
  storeNameAr?: string;
  storeNameEn?: string;
  localStoreName?: string;
}

export const basketSlice = createSlice({
  name: 'basket',
  initialState,
  reducers: {
    addToBasket: (state, action: PayloadAction<AddOfferPayload>) => {
      const {
        offer,
        storeName,
        branch,
        catalogue,
        store,
        storeNameAr,
        storeNameEn,
        localStoreName
      } = action.payload;

      // Log what we received
      console.log('🛒 [basketSlice] Adding offer to basket:', {
        offerId: offer.id,
        offerName: offer.nameAr,
        storeName,
        hasBranch: !!branch,
        branchStoreName: branch?.storeName,
        hasCatalogue: !!catalogue,
        catalogueTitle: catalogue?.titleAr,
        localStoreName,
      });

      const existingItem = state.items.find(
        item => item.type === 'offer' && item.offer?.id === offer.id
      );

      if (existingItem && existingItem.type === 'offer') {
        existingItem.quantity += 1;
        console.log(`🔄 [basketSlice] Updated quantity for ${offer.nameAr}: ${existingItem.quantity}`);
      } else {
        // Extract dates - try catalogue dates first, then fall back to offer dates
        let endDate = (offer as any).catalogueEndDate || catalogue?.endDate || offer.endDate;
        let startDate = (offer as any).catalogueStartDate || catalogue?.startDate || offer.startDate;

        // Normalize the dates
        if (endDate) endDate = normalizeDateString(endDate);
        if (startDate) startDate = normalizeDateString(startDate);

        console.log(`✅ [basketSlice] Creating basket item with dates:`, {
          startDate,
          endDate,
          source: (offer as any).catalogueEndDate ? 'offer.catalogueEndDate' :
                  catalogue?.endDate ? 'catalogue.endDate' :
                  'offer.endDate',
        });

        const newItem: BasketItem = {
          id: `offer-${offer.id}-${Date.now()}`,
          type: 'offer',
          offer,
          quantity: 1,

          // ✅ Store name with fallbacks
          storeName: localStoreName || branch?.storeName || storeName,
          storeNameAr,
          storeNameEn,
          localStoreName,

          // ✅ Store branch info (contains storeName for local stores like "زهران", "راية")
          branch,

          // ✅ Store catalogue info
          catalogue,
          cataloguePage: catalogue ? {
            catalogueId: catalogue.id,
            catalogueTitle: catalogue.titleAr,
            pageNumber: offer.pageNumber || 1,
            imageUrl: offer.pageImageUrl || offer.imageUrl,
          } : undefined,

          // ✅ Store object
          store,

          // Dates
          offerEndDate: endDate,
          offerStartDate: startDate,
          addedAt: new Date().toISOString(),
        };
        state.items.push(newItem);
      }

      // Recalculate total
      state.total = state.items.reduce((sum, item) => {
        if (item.type === 'offer' && item.offer) {
          return sum + (item.offer.offerPrice * item.quantity);
        }
        return sum;
      }, 0);
    },

    addPageToBasket: (state, action: PayloadAction<AddPagePayload>) => {
      const {
        catalogue,
        page,
        storeName,
        offers,
        branch,
        store,
        storeNameAr,
        storeNameEn,
        localStoreName
      } = action.payload;

      // Check if page already exists
      const existingItem = state.items.find(
        item => item.type === 'page' &&
               item.cataloguePage?.catalogueId === catalogue.id &&
               item.cataloguePage?.pageNumber === page.pageNumber
      );

      if (existingItem) {
        console.log('⚠️ [basketSlice] Page already in basket');
        return;
      }

      // Normalize catalogue dates
      const endDate = normalizeDateString(catalogue.endDate);
      const startDate = normalizeDateString(catalogue.startDate);

      console.log(`📄 [basketSlice] Adding page to basket:`, {
        catalogueId: catalogue.id,
        pageNumber: page.pageNumber,
        startDate,
        endDate,
        localStoreName: localStoreName || branch?.storeName,
      });

      const newItem: BasketItem = {
        id: `page-${catalogue.id}-${page.pageNumber}-${Date.now()}`,
        type: 'page',
        cataloguePage: {
          ...page,
          catalogueId: catalogue.id,
          catalogueTitle: catalogue.titleAr,
          offers: offers.map(o => o.id),
        },
        quantity: 1,

        // ✅ Store name with fallbacks
        storeName: localStoreName || branch?.storeName || catalogue.titleAr || storeName,
        storeNameAr,
        storeNameEn,
        localStoreName,

        // ✅ Store branch and catalogue info
        branch,
        catalogue,
        store,

        // Dates
        offerEndDate: endDate,
        offerStartDate: startDate,
        addedAt: new Date().toISOString(),
      };

      state.items.push(newItem);
    },

    updateBasketItemQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(i => i.id === id);

      if (item && item.type === 'offer') {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.id !== id);
          console.log(`🗑️ [basketSlice] Removed item ${id} (quantity 0)`);
        } else {
          item.quantity = quantity;
          console.log(`🔄 [basketSlice] Updated quantity for ${id}: ${quantity}`);
        }

        // Recalculate total
        state.total = state.items.reduce((sum, item) => {
          if (item.type === 'offer' && item.offer) {
            return sum + (item.offer.offerPrice * item.quantity);
          }
          return sum;
        }, 0);
      }
    },

    removeFromBasket: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      console.log(`🗑️ [basketSlice] Removed item ${itemId}`);

      // Recalculate total
      state.total = state.items.reduce((sum, item) => {
        if (item.type === 'offer' && item.offer) {
          return sum + (item.offer.offerPrice * item.quantity);
        }
        return sum;
      }, 0);
    },

    removeExpiredItems: (state) => {
      const beforeCount = state.items.length;

      // Filter out items where offerEndDate is expired
      state.items = state.items.filter(item => {
        if (!item.offerEndDate) return true; // Keep items without expiry date
        const expired = isDateExpired(item.offerEndDate);

        if (expired) {
          console.log(`🗑️ [basketSlice] Removing expired item: ${item.id}`);
        }

        return !expired;
      });

      const afterCount = state.items.length;
      const removedCount = beforeCount - afterCount;

      // Recalculate total
      state.total = state.items.reduce((sum, item) => {
        if (item.type === 'offer' && item.offer) {
          return sum + item.offer.offerPrice * item.quantity;
        }
        return sum;
      }, 0);

      console.log(`🗑️ [basketSlice] Removed ${removedCount} expired items from basket (${beforeCount} → ${afterCount})`);
    },

    clearBasket: (state) => {
      console.log('🗑️ [basketSlice] Clearing basket');
      state.items = [];
      state.total = 0;
    },

    hydrateBasket: (state, action: PayloadAction<BasketState>) => {
      state.items = action.payload.items;
      state.total = action.payload.total;
      console.log(`💧 [basketSlice] Hydrated basket with ${state.items.length} items`);
    },
  },
});

export const {
  addToBasket,
  addPageToBasket,
  updateBasketItemQuantity,
  removeFromBasket,
  removeExpiredItems,
  clearBasket,
  hydrateBasket,
} = basketSlice.actions;

export default basketSlice.reducer;