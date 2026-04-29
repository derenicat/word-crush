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
  moveLogs: { word: string; comboWords: string[]; score: number }[];
  gameStartTime: number;
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
  moveLogs: [],
  gameStartTime: 0,
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
      state.moveLogs = [];
      state.gameStartTime = Date.now();
      
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

    processValidWord: (state, action: PayloadAction<{ wordText: string, comboWords: string[], wordScore: number, newLetters: string[] }>) => {
      const size = state.grid.length;
      if (size === 0) return;

      const { wordText, comboWords, wordScore, newLetters } = action.payload;

      // Log kaydı oluştur
      state.moveLogs.unshift({ word: wordText, comboWords, score: wordScore });
      if (state.moveLogs.length > 50) state.moveLogs.pop(); // Sadece son 50 hamleyi tut

      state.score += wordScore;
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
    },

    applyJoker: (state, action: PayloadAction<{ type: string, targetRow?: number, targetCol?: number, targetRow2?: number, targetCol2?: number, newLetters: string[] }>) => {
      const { type, targetRow, targetCol, targetRow2, targetCol2, newLetters } = action.payload;
      const gridSize = state.grid.length;

      // YER DEĞİŞTİRME (SWAP)
      if (type === 'swap' && targetRow !== undefined && targetCol !== undefined && targetRow2 !== undefined && targetCol2 !== undefined) {
          const id1 = state.grid[targetRow][targetCol];
          const id2 = state.grid[targetRow2][targetCol2];
          if (id1 && id2) {
              state.grid[targetRow][targetCol] = id2;
              state.grid[targetRow2][targetCol2] = id1;
              state.cells[id1].row = targetRow2;
              state.cells[id1].col = targetCol2;
              state.cells[id2].row = targetRow;
              state.cells[id2].col = targetCol;
          }
          return;
      }

      // PARTİ BOOSTER (TÜM EKRANI TEMİZLE VE YENİLE)
      if (type === 'partyBooster') {
          for (let r = 0; r < gridSize; r++) {
              for (let c = 0; c < gridSize; c++) {
                  const id = state.grid[r][c];
                  if (id) delete state.cells[id];
              }
          }
          let idx = 0;
          for (let r = 0; r < gridSize; r++) {
              for (let c = 0; c < gridSize; c++) {
                  const newId = `${Date.now()}-${r}-${c}-${Math.random()}`;
                  state.grid[r][c] = newId;
                  state.cells[newId] = { id: newId, letter: newLetters[idx++] || 'A', row: r, col: c, status: 'idle' };
              }
          }
          return;
      }

      const toBeExploded = new Set<string>();

      if (type === 'lollipop' && targetRow !== undefined && targetCol !== undefined) {
        const id = state.grid[targetRow][targetCol];
        if (id) toBeExploded.add(id);
      } else if (type === 'wheel' && targetRow !== undefined && targetCol !== undefined) {
        for (let i = 0; i < gridSize; i++) {
          const idRow = state.grid[targetRow][i];
          if (idRow) toBeExploded.add(idRow);
          const idCol = state.grid[i][targetCol];
          if (idCol) toBeExploded.add(idCol);
        }
      } else if (type === 'fish') {
        const validIds: string[] = [];
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            if (state.grid[r][c]) validIds.push(state.grid[r][c]);
          }
        }
        for (let i = 0; i < 5; i++) {
          if (validIds.length > 0) {
            const randomIndex = Math.floor(Math.random() * validIds.length);
            toBeExploded.add(validIds[randomIndex]);
            validIds.splice(randomIndex, 1);
          }
        }
      }

      if (toBeExploded.size === 0) return;

      const queue = Array.from(toBeExploded);
      let head = 0;
      while (head < queue.length) {
        const currentId = queue[head++];
        const cell = state.cells[currentId];
        if (!cell) continue;

        if (cell.powerUp === 'row') {
          for (let c = 0; c < gridSize; c++) {
            const id = state.grid[cell.row][c];
            if (id && !toBeExploded.has(id)) { toBeExploded.add(id); queue.push(id); }
          }
        } else if (cell.powerUp === 'col') {
          for (let r = 0; r < gridSize; r++) {
            const id = state.grid[r][cell.col];
            if (id && !toBeExploded.has(id)) { toBeExploded.add(id); queue.push(id); }
          }
        } else if (cell.powerUp === 'area') {
          for (let r = cell.row - 1; r <= cell.row + 1; r++) {
            for (let c = cell.col - 1; c <= cell.col + 1; c++) {
              if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
                const id = state.grid[r][c];
                if (id && !toBeExploded.has(id)) { toBeExploded.add(id); queue.push(id); }
              }
            }
          }
        } else if (cell.powerUp === 'mega') {
          const letter = cell.letter;
          for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
              const id = state.grid[r][c];
              if (id && state.cells[id].letter === letter && !toBeExploded.has(id)) {
                toBeExploded.add(id); queue.push(id);
              }
            }
          }
        }
      }

      toBeExploded.forEach(id => {
        const cell = state.cells[id];
        if (cell) {
          state.grid[cell.row][cell.col] = '';
          delete state.cells[id];
        }
      });

      let letterIndex = 0;
      for (let c = 0; c < gridSize; c++) {
        let emptySpaces = 0;
        for (let r = gridSize - 1; r >= 0; r--) {
          if (state.grid[r][c] === '') {
            emptySpaces++;
          } else if (emptySpaces > 0) {
            const id = state.grid[r][c];
            state.grid[r + emptySpaces][c] = id;
            state.grid[r][c] = '';
            state.cells[id].row = r + emptySpaces;
          }
        }

        for (let r = emptySpaces - 1; r >= 0; r--) {
          const newId = `${Date.now()}-${r}-${c}-${Math.random()}`;
          state.grid[r][c] = newId;
          state.cells[newId] = { id: newId, letter: newLetters[letterIndex++] || 'A', row: r, col: c, status: 'idle' };
        }
      }
    },

    shuffleGrid: (state) => {
        const gridSize = state.grid.length;
        const allLetters: {letter: string, powerUp?: 'row' | 'col' | 'area' | 'mega'}[] = [];
        
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const id = state.grid[r][c];
                if (id && state.cells[id]) {
                    allLetters.push({
                        letter: state.cells[id].letter,
                        powerUp: state.cells[id].powerUp
                    });
                    delete state.cells[id];
                }
            }
        }
        
        // Fisher-Yates
        for (let i = allLetters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allLetters[i], allLetters[j]] = [allLetters[j], allLetters[i]];
        }
        
        let index = 0;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const newId = `${Date.now()}-${r}-${c}-${Math.random()}`;
                const data = allLetters[index++];
                state.grid[r][c] = newId;
                state.cells[newId] = {
                    id: newId,
                    row: r,
                    col: c,
                    letter: data.letter,
                    powerUp: data.powerUp,
                    status: 'idle'
                };
            }
        }
    }
  },
});

export const { initializeGrid, selectCell, clearSelection, processValidWord, invalidWordAttempt, updateAvailableWords, applyJoker, shuffleGrid } = gameSlice.actions;
export default gameSlice.reducer;
