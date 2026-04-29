// Türkçe harf kullanım frekansları (yaklaşık ağırlıklar %)
const LETTER_FREQUENCIES: Record<string, number> = {
  A: 11.9, E: 8.9, İ: 8.6, N: 7.4, R: 7.2,
  L: 5.9, I: 5.1, D: 4.7, K: 4.6, M: 3.7,
  U: 3.2, Y: 3.3, T: 3.0, S: 3.0, B: 2.8,
  O: 2.4, Ü: 1.8, Ş: 1.7, Z: 1.5, G: 1.2,
  Ç: 1.1, H: 1.1, Ğ: 1.1, V: 0.9, C: 0.9,
  Ö: 0.7, P: 0.7, F: 0.4, J: 0.1,
};

export class LetterGenerator {
  private static letters: string[] = [];
  
  // Ağırlıklara göre rastgele seçim yapabilmek için kümülatif bir dizi oluştur
  private static init() {
    if (this.letters.length > 0) return;
    for (const [letter, weight] of Object.entries(LETTER_FREQUENCIES)) {
        // Ağırlığı 10 ile çarpıp tam sayıya yuvarlayarak listeye o kadar ekleyelim
        const count = Math.max(1, Math.round(weight * 10));
        for (let i = 0; i < count; i++) {
            this.letters.push(letter);
        }
    }
  }

  static getRandomLetter(): string {
    this.init();
    const randomIndex = Math.floor(Math.random() * this.letters.length);
    return this.letters[randomIndex];
  }
}

// Letter puanları (Oyun kurallarında belirtilen puanlar)
export const LETTER_SCORES: Record<string, number> = {
  A: 1, B: 3, C: 4, Ç: 4, D: 3, E: 1, F: 7, G: 5, Ğ: 8, H: 5,
  I: 2, İ: 1, J: 10, K: 1, L: 1, M: 2, N: 1, O: 2, Ö: 7, P: 5,
  R: 1, S: 2, Ş: 4, T: 1, U: 2, Ü: 3, V: 7, Y: 3, Z: 4
};
