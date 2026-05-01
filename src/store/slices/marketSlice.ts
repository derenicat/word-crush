import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MarketState {
  gold: number;
  inventory: {
    fish: number;          
    wheel: number;         
    lollipop: number;      
    swap: number;          
    shuffle: number;       
    partyBooster: number;  
  }
}

// Proje pdf'inde test amaçlı sınırsız/yüksek altın tanımlanacaktır kuralına uyulmuştur.
const initialState: MarketState = {
  gold: 99999,
  inventory: {
    fish: 0,
    wheel: 0,
    lollipop: 0,
    swap: 0,
    shuffle: 0,
    partyBooster: 0
  }
};

const ITEM_PRICES = {
    fish: 100,
    wheel: 200,
    lollipop: 75,
    swap: 125,
    shuffle: 300,
    partyBooster: 400
};

export const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    buyItem: (state, action: PayloadAction<keyof typeof ITEM_PRICES>) => {
      const item = action.payload;
      const price = ITEM_PRICES[item];
      if (state.gold >= price) {
        state.gold -= price;
        state.inventory[item] += 1;
      }
    },
    consumeItem: (state, action: PayloadAction<keyof typeof ITEM_PRICES>) => {
      const item = action.payload;
      if (state.inventory[item] > 0) {
        state.inventory[item] -= 1;
      }
    },
    addGold: (state, action: PayloadAction<number>) => {
      state.gold += action.payload;
    }
  },
});

export const { buyItem, consumeItem, addGold } = marketSlice.actions;
export default marketSlice.reducer;
