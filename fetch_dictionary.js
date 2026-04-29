const fs = require('fs');
const https = require('https');
const path = require('path');

const url = "https://raw.githubusercontent.com/mertemin/turkish-word-list/master/words.txt";

console.log("Sözlük indiriliyor...");

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Sadece Türkçe harflerden oluşan kelimeleri kabul eden Regex
    // Boşluk, tire, sayı veya özel karakter barındıran kelimeler ("zührevi hastalık" vb.) elenir.
    const turkishLettersOnly = /^[A-ZÇĞİÖŞÜ]+$/;

    const words = data.split('\n')
      .map(w => w.trim().toLocaleUpperCase('tr-TR'))
      .filter(w => w.length >= 3 && turkishLettersOnly.test(w));
    
    // Benzersiz olanları al
    const uniqueWords = [...new Set(words)];

    const targetDir = path.join(__dirname, 'assets');
    if (!fs.existsSync(targetDir)){
        fs.mkdirSync(targetDir);
    }

    fs.writeFileSync(path.join(targetDir, 'dictionary.json'), JSON.stringify(uniqueWords));
    console.log(`Başarılı! Kriterlere uyan ${uniqueWords.length} adet Türkçe kelime assets/dictionary.json dosyasına kaydedildi.`);
  });
}).on('error', err => console.error(err));
