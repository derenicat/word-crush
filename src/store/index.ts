import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';

import gameReducer from './slices/gameSlice';
import marketReducer from './slices/marketSlice';
import userReducer from './slices/userSlice';

// Expo Router (Web SSR) ortamında window objesi olmadığı için fallback storage
const createNoopStorage = () => {
  return {
    getItem: (_key: string) => Promise.resolve(null),
    setItem: (_key: string, _value: string) => Promise.resolve(),
    removeItem: (_key: string) => Promise.resolve(),
  };
};

const storage =
  typeof window !== 'undefined' ? AsyncStorage : createNoopStorage();

const persistConfig = {
  key: 'root',
  storage: storage,
  // Oyuncunun kaldığı yerden devam edebilmesi için game state'ini de kaydediyoruz
  whitelist: ['game', 'user', 'market'],
};

const rootReducer = combineReducers({
  game: gameReducer,
  user: userReducer,
  market: marketReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
