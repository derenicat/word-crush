import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  username: string | null;
  totalGamesPlayed: number;
  highestScore: number;
  averageScore: number;
  totalWordsFound: number;
  longestWord: string;
  totalPlayTimeMinutes: number;
}

const initialState: UserState = {
  username: null,
  totalGamesPlayed: 0,
  highestScore: 0,
  averageScore: 0,
  totalWordsFound: 0,
  longestWord: '',
  totalPlayTimeMinutes: 0,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },
    updateStatsAfterGame: (state, action: PayloadAction<{ score: number, wordsFound: number, longest: string, duration: number }>) => {
      state.totalGamesPlayed += 1;
      
      const totalPastScore = state.averageScore * (state.totalGamesPlayed - 1);
      state.averageScore = (totalPastScore + action.payload.score) / state.totalGamesPlayed;
      
      if (action.payload.score > state.highestScore) {
        state.highestScore = action.payload.score;
      }
      state.totalWordsFound += action.payload.wordsFound;
      
      if (action.payload.longest.length > state.longestWord.length) {
        state.longestWord = action.payload.longest;
      }
      
      state.totalPlayTimeMinutes += action.payload.duration;
    }
  },
});

export const { setUsername, updateStatsAfterGame } = userSlice.actions;
export default userSlice.reducer;
