import { Trie } from './Trie';
import { LETTER_SCORES } from './LetterGenerator';

export type Coordinate = { row: number; col: number };

export type FoundWord = {
  text: string;
  path: Coordinate[];
};

// 8 Yön vektörleri: [dRow, dCol]
const DIRECTIONS = [
  [-1, 0], // Yukarı
  [1, 0],  // Aşağı
  [0, -1], // Sol
  [0, 1],  // Sağ
  [-1, -1], // Sol Üst Çapraz
  [-1, 1],  // Sağ Üst Çapraz
  [1, -1],  // Sol Alt Çapraz
  [1, 1],   // Sağ Alt Çapraz
];

export class RaycastEngine {
  private trie: Trie;

  constructor(trie: Trie) {
    this.trie = trie;
  }

  // Grid üzerindeki tüm olası kelimeleri (Raycast ile) bulur
  public findAllWords(grid: string[][]): FoundWord[] {
    const rows = grid.length;
    if (rows === 0) return [];
    const cols = grid[0].length;
    const foundWords: FoundWord[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Her bir hücreden 8 yöne ışın yolla
        for (const [dr, dc] of DIRECTIONS) {
          this.castRay(grid, r, c, dr, dc, rows, cols, foundWords);
        }
      }
    }

    return foundWords;
  }

  private castRay(
    grid: string[][],
    startRow: number,
    startCol: number,
    dr: number,
    dc: number,
    maxRows: number,
    maxCols: number,
    foundWords: FoundWord[]
  ) {
    let currentText = '';
    const currentPath: Coordinate[] = [];
    let r = startRow;
    let c = startCol;

    while (r >= 0 && r < maxRows && c >= 0 && c < maxCols) {
      const letter = grid[r][c];
      // Eğer hücre boşsa (patlamış harfler henüz düşmediyse), ışın kesilir.
      if (!letter || letter === '') break;

      currentText += letter;
      currentPath.push({ row: r, col: c });

      // Trie'de bu prefix yoksa daha fazla ilerlemeye gerek yok (Budama / Pruning)
      if (!this.trie.startsWith(currentText)) {
        break;
      }

      // Eğer kelime 3 harften uzunsa ve sözlükte varsa, listeye ekle
      if (currentText.length >= 3 && this.trie.search(currentText)) {
        foundWords.push({
          text: currentText,
          path: [...currentPath],
        });
      }

      r += dr;
      c += dc;
    }
  }

  // "Kesişmeyen" (non-overlapping) kelimeleri Açgözlü (Greedy) algoritma ile bulur.
  // Sıralama: En uzundan en kısaya (Length DESC)
  public calculateNonOverlappingCount(foundWords: FoundWord[]): number {
    // Kopyasını alıp sıralayalım
    const sortedWords = [...foundWords].sort((a, b) => b.text.length - a.text.length);
    
    // Ziyaret edilen koordinatları string formatında tutan set: "row,col"
    const visited = new Set<string>();
    let count = 0;

    for (const word of sortedWords) {
      // Kelimenin harflerinden herhangi biri önceden kullanılmış mı kontrol et
      let hasOverlap = false;
      for (const coord of word.path) {
        if (visited.has(`${coord.row},${coord.col}`)) {
          hasOverlap = true;
          break;
        }
      }

      // Eğer hiçbir harfi başka kelimeyle kesişmiyorsa (veya prefix'in uzun versiyonuysa), kabul et
      if (!hasOverlap) {
        count++;
        // Harfleri işaretle
        for (const coord of word.path) {
          visited.add(`${coord.row},${coord.col}`);
        }
      }
    }

    return count;
  }

  // Combo mekanizması: Ana kelime içindeki 3+ harfli anlamlı alt kelimeleri bulur
  // Ayrıca combo'ların toplam puanını döndürür.
  public calculateComboAndScore(mainWord: string): { totalScore: number; comboWords: string[] } {
    let totalScore = 0;
    const comboWords: string[] = [];
    const length = mainWord.length;

    // Alt kelime (substring) kontrolü: i başlangıç, j bitiş indeksi
    // Sıraları bozulmamalı, sadece baştan/sondan kesilebilir.
    for (let i = 0; i < length; i++) {
      for (let j = i + 3; j <= length; j++) {
        const subWord = mainWord.substring(i, j);
        if (this.trie.search(subWord)) {
          // Alt kelime bulunduğunda combo listesine ekle
          // (Ana kelime de buraya otomatik dahil olur, çünkü i=0, j=length durumu da kontrol edilecek)
          if (!comboWords.includes(subWord)) {
            comboWords.push(subWord);
            // Alt kelimenin puanını hesapla ve toplama ekle
            let subScore = 0;
            for (const char of subWord) {
              subScore += LETTER_SCORES[char] || 0;
            }
            totalScore += subScore;
          }
        }
      }
    }

    return { totalScore, comboWords };
  }
}
