import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { BasketState, BasketItem, Offer, CataloguePage, Catalogue } from '../../types';
import { syncBasketToFirestore } from '../../services/userDataService';

const initialState: BasketState = {
  items: [],
  total: 0,
};

// Helper to calculate total
const calculateTotal = (items: BasketItem[]): number => {
  return items.reduce((sum, item) => {
    if (item.type === 'offer' && item.offer) {
      return sum + item.offer.offerPrice * item.quantity;
    }
    // Pages don't have a price
    return sum;
  }, 0);
};

export const basketSlice = createSlice({
  name: 'basket',
  initialState,
  reducers: {
    addToBasket: (state, action: PayloadAction<{ offer: Offer; storeName: string }>) => {
      const { offer, storeName } = action.payload;
      const existingItem = state.items.find(
        item => item.type === 'offer' && item.offerId === offer.id
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        const newItem: BasketItem = {
          id: `basket_offer_${Date.now()}`,
          offerId: offer.id,
          offer,
          quantity: 1,
          addedAt: new Date().toISOString(),
          storeName,
          offerEndDate: offer.endDate,
          type: 'offer',
        };
        state.items.push(newItem);
      }

      state.total = calculateTotal(state.items);
    },

    // NEW: Add entire catalogue page to basket
    addPageToBasket: (
      state,
      action: PayloadAction<{
        catalogue: Catalogue;
        page: CataloguePage;
        storeName: string;
        offers: Offer[];
      }>
    ) => {
      const { catalogue, page, storeName, offers } = action.payload;

      // Check if this page is already saved
      const existingPage = state.items.find(
        item =>
          item.type === 'page' &&
          item.cataloguePage?.catalogueId === catalogue.id &&
          item.cataloguePage?.pageNumber === page.pageNumber
      );

      if (existingPage) {
        // Already saved, don't add duplicate
        return;
      }

      const newItem: BasketItem = {
        id: `basket_page_${Date.now()}`,
        cataloguePage: {
          id: page.id,
          catalogueId: catalogue.id,
          catalogueTitle: catalogue.titleAr,
          pageNumber: page.pageNumber,
          imageUrl: page.imageUrl,
          offerIds: page.offers,
          savedAt: new Date().toISOString(),
        },
        quantity: 1, // Pages always have quantity 1
        addedAt: new Date().toISOString(),
        storeName,
        offerEndDate: catalogue.endDate,
        type: 'page',
      };

      state.items.unshift(newItem); // Add to beginning
      state.total = calculateTotal(state.items);
    },

    // NEW: Add PDF page from PDF viewer to basket
    addPdfPageToBasket: (
      state,
      action: PayloadAction<{
        catalogueId: string;
        catalogueTitle: string;
        pageNumber: number;
        pageImageUri: string;
        storeName: string;
        endDate: string;
      }>
    ) => {
      const { catalogueId, catalogueTitle, pageNumber, pageImageUri, storeName, endDate } = action.payload;

      // Check if this page is already saved
      const existingPage = state.items.find(
        item =>
          item.type === 'page' &&
          item.cataloguePage?.catalogueId === catalogueId &&
          item.cataloguePage?.pageNumber === pageNumber
      );

      if (existingPage) {
        // Already saved, don't add duplicate
        return;
      }

      // Generate more unique ID combining timestamp, random, and page info
      const uniqueId = `basket_pdf_page_${catalogueId}_${pageNumber}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newItem: BasketItem = {
        id: uniqueId,
        cataloguePage: {
          id: `pdf_page_${catalogueId}_${pageNumber}`,
          catalogueId,
          catalogueTitle,
          pageNumber,
          imageUrl: pageImageUri,
          offerIds: [],
          savedAt: new Date().toISOString(),
        },
        quantity: 1,
        addedAt: new Date().toISOString(),
        storeName,
        offerEndDate: endDate,
        type: 'page',
      };

      state.items.unshift(newItem);
      state.total = calculateTotal(state.items);
    },

    removeFromBasket: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.total = calculateTotal(state.items);
    },

    updateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(i => i.id === itemId);

      if (item && item.type === 'offer') {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.id !== itemId);
        } else {
          item.quantity = quantity;
        }
      }

      state.total = calculateTotal(state.items);
    },

    clearBasket: (state) => {
      state.items = [];
      state.total = 0;
    },

    hydrateBasket: (state, action: PayloadAction<BasketState>) => {
      state.items = action.payload.items;
      state.total = action.payload.total;
    },

    // Sync basket to Firestore for authenticated users
    // Note: This is a fire-and-forget operation intentionally kept in the reducer
    // for simplicity. The sync happens in the background without blocking the UI.
    // Consider moving to middleware or async thunk for more complex sync logic.
    syncBasket: (state, action: PayloadAction<string>) => {
      const uid = action.payload;
      if (uid) {
        syncBasketToFirestore(uid, state.items).catch((error) => {
          console.error('Error syncing basket:', error);
        });
      }
    },
  },
});

export const {
  addToBasket,
  addPageToBasket,
  addPdfPageToBasket,
  removeFromBasket,
  updateQuantity,
  clearBasket,
  hydrateBasket,
  syncBasket,
} = basketSlice.actions;

export default basketSlice.reducer;