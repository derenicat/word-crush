# Word Crush 👋

Word Crush, React Native ve Expo kullanılarak geliştirilmiş, modern görseller ve zengin oyun mekanikleriyle donatılmış bir kelime bulmaca oyunudur. Bu proje, karmaşık algoritmalardan (Trie, DFS) faydalanarak yüksek performanslı bir oyun deneyimi sunar.

---

## 🚀 Başlangıç

### 1. Bağımlılıkları Kurun

```bash
npm install
```

### 2. Uygulamayı Başlatın

```bash
npx expo start
```

Terminaldeki yönergeleri takip ederek uygulamayı iOS/Android simülatöründe veya fiziksel cihazınızda (Expo Go) açabilirsiniz.

---

## 🕹️ Oyun Mantığı

Word Crush, harf gridi üzerinde parmağınızı sürükleyerek anlamlı kelimeler oluşturma üzerine kuruludur.

- **Seçim:** Harfler yatay, dikey veya çapraz olarak (8 yön) bağlanabilir.
- **Geri Alma (Backtrack):** Parmağınızı seçtiğiniz bir önceki harfin üzerine getirdiğinizde son harf seçimini iptal eder.
- **Combo Sistemi:** Seçtiğiniz uzun kelimenin içinde geçen tüm 3 harf ve üzeri alt kelimeler de otomatik olarak bulunur ve puanınıza eklenir.
- **Özel Güçler (Power-ups):** 4 harf ve üzeri kelimeler oluşturduğunuzda, seçtiğiniz son harfe özel güçler atanır (Satır patlatma, sütun patlatma, alan patlatma vb.).

---

## 🧠 Teknik Mimari ve Algoritmalar

### 1. Trie (Sözlük Veri Yapısı)

48.000+ kelimelik Türkçe sözlükte milisaniyeler içinde arama yapmak için **Trie (Önek Ağacı)** veri yapısı kullanılır. Bu yapı, bir kelimenin hem tam halini hem de bir önek (prefix) olup olmadığını anında kontrol etmemizi sağlar.

**Kod Örneği:**

```typescript
// src/engine/Trie.ts
export class Trie {
  insert(word: string): void {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
  }

  startsWith(prefix: string): boolean {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) return false;
      node = node.children.get(char)!;
    }
    return true;
  }
}
```

### 2. DFS Engine (Tahta Analizi)

Oyun tahtası her değiştiğinde, arka planda bir **DFS (Depth-First Search)** algoritması çalışarak tahtadaki tüm olası kelimeleri tarar. Bu, kullanıcıya kaç tane "bulunabilir kelime" kaldığını göstermek için kullanılır.

**Algoritma Mantığı:**

- Tahtanın her hücresinden bir arama başlatılır.
- Trie kullanılarak "budama" (pruning) yapılır; yani mevcut harf dizisi bir kelimenin başlangıcı değilse arama o yönde durdurulur.
- 8 yöne doğru recursive olarak ilerlenir.

```typescript
// src/engine/DFSEngine.ts
private dfs(grid, r, c, currentText, visited, foundWords) {
  const letter = grid[r][c];
  const newText = currentText + letter;

  // Pruning: Eğer bu prefix trie'de yoksa direkt kes
  if (!this.trie.startsWith(newText)) return;

  if (newText.length >= 3 && this.trie.search(newText)) {
    foundWords.push({ text: newText, path: newPath });
  }

  for (const [dr, dc] of DIRECTIONS) {
    // 8 yöne DFS devam...
  }
}
```

### 3. Redux State Management

Oyunun tüm durumu (grid, hücre verileri, skor, hamle sayısı) **Redux Toolkit** ile yönetilir. `gameSlice`, `userSlice` ve `marketSlice` olmak üzere üç ana parçadan oluşur.

- **gameSlice:** Oyunun kalbi. Grid üretimi, harf düşme (gravity) mantığı ve kelime işleme burada gerçekleşir.
- **userSlice:** Kullanıcı istatistikleri ve geçmiş oyun verilerini (Redux Persist ile kalıcı olarak) tutar.
- **marketSlice:** Altın miktarı ve joker envanterini yönetir.

---
