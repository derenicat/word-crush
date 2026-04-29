import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  username: string | null;
  totalGamesPlayed: number;
  highestScore: number;
  averageScore: number;
  totalWordsFound: number;
  longestWord: string;
  totalPlayTimeMinutes: number;
  pastGames: { id: string, date: string, score: number, wordsFound: number, level: string }[];
}

const initialState: UserState = {
  username: null,
  totalGamesPlayed: 0,
  highestScore: 0,
  averageScore: 0,
  totalWordsFound: 0,
  longestWord: '',
  totalPlayTimeMinutes: 0,
  pastGames: [],
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
      
      if (!state.pastGames) state.pastGames = [];
      
      state.pastGames.unshift({
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        score: action.payload.score,
        wordsFound: action.payload.wordsFound,
        level: 'Tamamlandı'
      });
      if (state.pastGames.length > 50) state.pastGames.pop(); // Son 50 oyunu tut
    }
  },
});

export const { setUsername, updateStatsAfterGame } = userSlice.actions;
export default userSlice.reducer;
