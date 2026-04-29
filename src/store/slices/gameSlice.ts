import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LetterGenerator } from '../../engine/LetterGenerator';

export interface CellData {
  id: string;
  letter: string;
  row: number;
  col: number;
  status: 'idle' | 'selected' | 'exploding' | 'falling';
  powerUp?: 'row' | 'col' | 'area' | 'mega' | null;
}

export interface GameState {
  grid: string[][]; 
  cells: Record<string, CellData>; 
  score: number;
  movesLeft: number;
  maxMoves: number;
  level: 'easy' | 'medium' | 'hard';
  availableWordCount: number;
  selectedIds: string[];
}

const initialState: GameState = {
  grid: [],
  cells: {},
  score: 0,
  movesLeft: 0,
  maxMoves: 0,
  level: 'medium',
  availableWordCount: 0,
  selectedIds: [],
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    initializeGrid: (state, action: PayloadAction<{ size: number; moves: number; level: 'easy'|'medium'|'hard' }>) => {
      const { size, moves, level } = action.payload;
      state.level = level;
      state.movesLeft = moves;
      state.maxMoves = moves;
      state.score = 0;
      state.selectedIds = [];
      
      const newGrid: string[][] = [];
      const newCells: Record<string, CellData> = {};

      for (let r = 0; r < size; r++) {
        const row: string[] = [];
        for (let c = 0; c < size; c++) {
          const id = `${r}-${c}-${Date.now()}-${Math.random()}`;
          row.push(id);
          newCells[id] = {
            id,
            letter: LetterGenerator.getRandomLetter(),
            row: r,
            col: c,
            status: 'idle',
            powerUp: null
          };
        }
        newGrid.push(row);
      }
      
      state.grid = newGrid;
      state.cells = newCells;
    },
    
    selectCell: (state, action: PayloadAction<string>) => {
        const id = action.payload;
        if(!state.cells[id]) return;
        
        const cell = state.cells[id];
        
        // İlk harf seçimi
        if (state.selectedIds.length === 0) {
            state.selectedIds.push(id);
            state.cells[id].status = 'selected';
            return;
        }

        // Backtracking (Geri Alma) Kontrolü
        if (state.selectedIds.length > 1) {
            const prevId = state.selectedIds[state.selectedIds.length - 2];
            // Eğer bir önceki hücrenin üzerine geri gelindiyse, son hücreyi çıkart (pop)
            if (id === prevId) {
                const popped = state.selectedIds.pop();
                if (popped) {
                    state.cells[popped].status = 'idle';
                }
                return;
            }
        }

        // Zaten seçiliyse (ve bir önceki hücre değilse) yoksay (kendi üstünden geçemez)
        if (state.selectedIds.includes(id)) return;

        // Boggle Komşu Kontrolü
        const lastId = state.selectedIds[state.selectedIds.length - 1];
        const lastCell = state.cells[lastId];
        const dr = Math.abs(cell.row - lastCell.row);
        const dc = Math.abs(cell.col - lastCell.col);
        
        // Komşu hücre olmak zorunda (Mesafe max 1)
        if (dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0)) {
            state.selectedIds.push(id);
            state.cells[id].status = 'selected';
        }
    },
    
    clearSelection: (state) => {
        state.selectedIds.forEach(id => {
            if(state.cells[id]) state.cells[id].status = 'idle';
        });
        state.selectedIds = [];
    },

    processValidWord: (state, action: PayloadAction<{ wordScore: number, newLetters: string[] }>) => {
      const size = state.grid.length;
      if (size === 0) return;

      state.score += action.payload.wordScore;
      state.movesLeft = Math.max(0, state.movesLeft - 1);

      // --- POWER-UP OLUŞTURMA (Son harfi koru) ---
      let newPowerUpId: string | null = null;
      let newPowerUpType: 'row' | 'col' | 'area' | 'mega' | null = null;
      const wordLength = state.selectedIds.length;

      if (wordLength === 4) newPowerUpType = 'row';
      else if (wordLength === 5) newPowerUpType = 'area';
      else if (wordLength === 6) newPowerUpType = 'col';
      else if (wordLength >= 7) newPowerUpType = 'mega';

      const toBeExploded = new Set<string>(state.selectedIds);

      if (newPowerUpType) {
        newPowerUpId = state.selectedIds[state.selectedIds.length - 1];
        toBeExploded.delete(newPowerUpId);
      }

      // --- ZİNCİRLEME PATLAMALAR (Chain Reactions) ---
      const queue = Array.from(toBeExploded);
      const processed = new Set<string>();

      while (queue.length > 0) {
        const id = queue.shift()!;
        if (processed.has(id)) continue;
        processed.add(id);

        const cell = state.cells[id];
        if (!cell || id === '') continue;

        if (cell.powerUp) {
          const { row, col } = cell;
          if (cell.powerUp === 'row') {
            for (let c = 0; c < size; c++) queue.push(state.grid[row][c]);
          } else if (cell.powerUp === 'col') {
            for (let r = 0; r < size; r++) queue.push(state.grid[r][col]);
          } else if (cell.powerUp === 'area') {
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < size && nc >= 0 && nc < size) queue.push(state.grid[nr][nc]);
              }
            }
          } else if (cell.powerUp === 'mega') {
            for (let dr = -2; dr <= 2; dr++) {
              for (let dc = -2; dc <= 2; dc++) {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < size && nc >= 0 && nc < size) queue.push(state.grid[nr][nc]);
              }
            }
          }
        }
      }

      // Oluşacak power up zincirleme patlamanın içinde kalmasın
      if (newPowerUpId) {
        processed.delete(newPowerUpId);
        state.cells[newPowerUpId].status = 'idle';
        state.cells[newPowerUpId].powerUp = newPowerUpType;
      }

      // 2. Patlayan harfleri grid'den çıkar (null yap)
      processed.forEach(id => {
        const cell = state.cells[id];
        if (cell) {
          state.grid[cell.row][cell.col] = '';
          delete state.cells[id]; 
          // Zincirleme patlamalardan ekstra puan eklenebilir, şimdilik sadece sabit veriyoruz
          state.score += 2; 
        }
      });

      // 3. Gravity (Yerçekimi) Uygula
      let newLetterIdx = 0;
      
      for (let c = 0; c < size; c++) {
        let emptyCount = 0;
        
        for (let r = size - 1; r >= 0; r--) {
          const id = state.grid[r][c];
          if (id === '') {
            emptyCount++;
          } else if (emptyCount > 0) {
            const newRow = r + emptyCount;
            state.grid[newRow][c] = id;
            state.grid[r][c] = '';
            
            if(state.cells[id]) {
                state.cells[id].row = newRow;
            }
          }
        }

        // 4. En üste boşluklar kadar yeni harf ekle
        for (let r = 0; r < emptyCount; r++) {
          const newId = `new-${r}-${c}-${Date.now()}-${Math.random()}`;
          const letter = action.payload.newLetters[newLetterIdx++] || 'A';
          state.grid[r][c] = newId;
          state.cells[newId] = {
            id: newId,
            letter: letter,
            row: r,
            col: c,
            status: 'idle',
            powerUp: null
          };
        }
      }

      state.selectedIds = [];
    },
    
    invalidWordAttempt: (state) => {
        // Hatalı veya kısa kelimede (min 3) sadece seçimi sıfırla, movesLeft cezasını kaldırdık.
        state.selectedIds.forEach(id => {
            if(state.cells[id]) state.cells[id].status = 'idle';
        });
        state.selectedIds = [];
    },

    updateAvailableWords: (state, action: PayloadAction<number>) => {
        state.availableWordCount = action.payload;
    }
  },
});

export const { initializeGrid, selectCell, clearSelection, processValidWord, invalidWordAttempt, updateAvailableWords } = gameSlice.actions;
export default gameSlice.reducer;
