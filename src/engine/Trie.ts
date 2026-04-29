export class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

export class Trie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

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

  // Arama optimizasyonu için: verilen kelimenin tam kelime olup olmadığını kontrol eder.
  search(word: string): boolean {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char)!;
    }
    return node.isEndOfWord;
  }

  // Raycast sırasında budama (pruning) yapmak için prefix kontrolü
  startsWith(prefix: string): boolean {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char)!;
    }
    return true;
  }
  
  // Sözlük dosyasından yükleme metodu
  loadDictionary(words: string[]) {
      for(const word of words) {
          // Oyunda min 3 harf kuralı olduğu için 3 harften kısaları eklemiyoruz
          if(word.length >= 3) {
              // Türkçeye özel büyük/küçük harf sorununu önlemek için hepsi büyük harfle tutulabilir
              this.insert(word.toLocaleUpperCase('tr-TR'));
          }
      }
  }
}
