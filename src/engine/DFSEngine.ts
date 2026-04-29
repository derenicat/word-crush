import { Trie } from './Trie';

export type Coordinate = { row: number; col: number };

export type FoundWord = {
  text: string;
  path: Coordinate[];
};

// 8 Yön (Boggle kuralları)
const DIRECTIONS = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [-1, 1], [1, -1], [1, 1],
];

export class DFSEngine {
  private trie: Trie;

  constructor(trie: Trie) {
    this.trie = trie;
  }

  public findAllWords(grid: string[][]): FoundWord[] {
    const rows = grid.length;
    if (rows === 0) return [];
    const cols = grid[0].length;
    const foundWords: FoundWord[] = [];
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.dfs(grid, r, c, '', [], visited, foundWords, rows, cols);
      }
    }

    return foundWords;
  }

  private dfs(
    grid: string[][],
    r: number,
    c: number,
    currentText: string,
    currentPath: Coordinate[],
    visited: boolean[][],
    foundWords: FoundWord[],
    rows: number,
    cols: number
  ) {
    const letter = grid[r][c];
    if (!letter || letter === '') return;

    const newText = currentText + letter;
    
    // Pruning (Budama) - Eğer bu prefix trie'de yoksa direkt kes
    if (!this.trie.startsWith(newText)) return;

    const newPath = [...currentPath, { row: r, col: c }];
    visited[r][c] = true;

    // Geçerli kelime kontrolü
    if (newText.length >= 3 && this.trie.search(newText)) {
      foundWords.push({
        text: newText,
        path: newPath,
      });
    }

    // 8 yöne dfs devam
    for (const [dr, dc] of DIRECTIONS) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
        this.dfs(grid, nr, nc, newText, newPath, visited, foundWords, rows, cols);
      }
    }

    visited[r][c] = false; // Backtrack (Ziyaret flag'ini geri al)
  }

  // Çakışmayan kelimeleri hesaplama (Açgözlü Algoritma)
  public calculateNonOverlappingCount(foundWords: FoundWord[]): number {
    const sortedWords = [...foundWords].sort((a, b) => b.text.length - a.text.length);
    const visited = new Set<string>();
    let count = 0;

    for (const word of sortedWords) {
      let hasOverlap = false;
      for (const coord of word.path) {
        if (visited.has(`${coord.row},${coord.col}`)) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        count++;
        for (const coord of word.path) {
          visited.add(`${coord.row},${coord.col}`);
        }
      }
    }
    return count;
  }
}
