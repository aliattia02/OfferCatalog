import { createSlice, PayloadAction } from '@reduxjs/toolkit';
<<<<<<< HEAD
import type { BasketState, BasketItem, Offer, CataloguePage, Catalogue } from '../../types';
=======
import type { BasketState, BasketItem, Offer } from '../../types';
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537

const initialState: BasketState = {
  items: [],
  total: 0,
};

// Helper to calculate total
const calculateTotal = (items: BasketItem[]): number => {
<<<<<<< HEAD
  return items.reduce((sum, item) => {
    if (item.type === 'offer' && item.offer) {
      return sum + item.offer.offerPrice * item.quantity;
    }
    // Pages don't have a price
    return sum;
  }, 0);
=======
  return items.reduce((sum, item) => sum + item.offer.offerPrice * item.quantity, 0);
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
};

export const basketSlice = createSlice({
  name: 'basket',
  initialState,
  reducers: {
    addToBasket: (state, action: PayloadAction<{ offer: Offer; storeName: string }>) => {
      const { offer, storeName } = action.payload;
<<<<<<< HEAD
      const existingItem = state.items.find(
        item => item.type === 'offer' && item.offerId === offer.id
      );

=======
      const existingItem = state.items.find(item => item.offerId === offer.id);
      
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        const newItem: BasketItem = {
<<<<<<< HEAD
          id: `basket_offer_${Date.now()}`,
=======
          id: `basket_${Date.now()}`,
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
          offerId: offer.id,
          offer,
          quantity: 1,
          addedAt: new Date().toISOString(),
          storeName,
          offerEndDate: offer.endDate,
<<<<<<< HEAD
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

=======
        };
        state.items.push(newItem);
      }
      
      state.total = calculateTotal(state.items);
    },
    
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
    removeFromBasket: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.total = calculateTotal(state.items);
    },
<<<<<<< HEAD

    updateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(i => i.id === itemId);

      if (item && item.type === 'offer') {
=======
    
    updateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(i => i.id === itemId);
      
      if (item) {
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.id !== itemId);
        } else {
          item.quantity = quantity;
        }
      }
<<<<<<< HEAD

      state.total = calculateTotal(state.items);
    },

=======
      
      state.total = calculateTotal(state.items);
    },
    
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
    clearBasket: (state) => {
      state.items = [];
      state.total = 0;
    },
<<<<<<< HEAD

=======
    
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
    hydrateBasket: (state, action: PayloadAction<BasketState>) => {
      state.items = action.payload.items;
      state.total = action.payload.total;
    },
  },
});

export const {
  addToBasket,
<<<<<<< HEAD
  addPageToBasket,
=======
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
  removeFromBasket,
  updateQuantity,
  clearBasket,
  hydrateBasket,
} = basketSlice.actions;

<<<<<<< HEAD
export default basketSlice.reducer;
=======
export default basketSlice.reducer;
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
