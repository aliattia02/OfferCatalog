import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { BasketState, BasketItem, Offer } from '../../types';

const initialState: BasketState = {
  items: [],
  total: 0,
};

// Helper to calculate total
const calculateTotal = (items: BasketItem[]): number => {
  return items.reduce((sum, item) => sum + item.offer.offerPrice * item.quantity, 0);
};

export const basketSlice = createSlice({
  name: 'basket',
  initialState,
  reducers: {
    addToBasket: (state, action: PayloadAction<{ offer: Offer; storeName: string }>) => {
      const { offer, storeName } = action.payload;
      const existingItem = state.items.find(item => item.offerId === offer.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        const newItem: BasketItem = {
          id: `basket_${Date.now()}`,
          offerId: offer.id,
          offer,
          quantity: 1,
          addedAt: new Date().toISOString(),
          storeName,
          offerEndDate: offer.endDate,
        };
        state.items.push(newItem);
      }
      
      state.total = calculateTotal(state.items);
    },
    
    removeFromBasket: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.total = calculateTotal(state.items);
    },
    
    updateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(i => i.id === itemId);
      
      if (item) {
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
  },
});

export const {
  addToBasket,
  removeFromBasket,
  updateQuantity,
  clearBasket,
  hydrateBasket,
} = basketSlice.actions;

export default basketSlice.reducer;
