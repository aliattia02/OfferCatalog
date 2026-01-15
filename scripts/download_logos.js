const fs = require('fs');
const https = require('https');
const path = require('path');

const stores = [
  { id: 'carrefour', text: 'Carrefour كارفور', bg: '0066CC', fg: 'ffffff' },
  { id: 'hyperone', text: 'HyperOne هايبر وان', bg: 'ff3333', fg: 'ffffff' },
  { id: 'kazyon', text: 'Kazyon كازيون', bg: 'e63946', fg: 'ffffff' },
  { id: 'awladragab', text: 'Awlad Ragab أولاد رجب', bg: '9933cc', fg: 'ffffff' },
  { id: 'metro', text: 'Metro مترو', bg: '0066cc', fg: 'ffffff' },
  { id: 'spinneys', text: 'Spinneys سبينيس', bg: '00aa44', fg: 'ffffff' },
  { id: 'seoudi', text: 'Seoudi سعودي', bg: 'ff8800', fg: 'ffffff' },
  { id: 'kheirzaman', text: 'Kheir Zaman خير زمان', bg: '22aa77', fg: 'ffffff' },
  { id: 'fathalla', text: 'Fathalla فتح الله', bg: 'cc4444', fg: 'ffffff' },
  { id: 'bim', text: 'BIM بيم', bg: 'FFD700', fg: '333333' },
  { id: 'btech', text: 'B.TECH بي تك', bg: 'ff6600', fg: 'ffffff' },
  { id: 'oscar', text: 'Oscar أوسكار', bg: '0066ff', fg: 'ffffff' },
  { id: 'extra', text: 'eXtra إكسترا', bg: 'FF0000', fg: 'ffffff' },
  { id: 'sharkia_local', text: 'Sharkia متاجر الشرقية', bg: '2E8B57', fg: 'ffffff' },
  { id: 'dakahlia_local', text: 'Dakahlia متاجر الدقهلية', bg: '4169E1', fg: 'ffffff' },
  { id: 'cairo_local', text: 'Cairo متاجر القاهرة', bg: 'DC143C', fg: 'ffffff' }
];

const dir = './logos';
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

console.log("Starting download...");

stores.forEach(store => {
  // We add .png to the path and encode the text query
  const url = `https://placehold.co/400x400/${store.bg}/${store.fg}.png?text=${encodeURIComponent(store.text)}`;
  const filePath = path.join(dir, `${store.id}.png`);
  const file = fs.createWriteStream(filePath);

  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Error: Failed to download ${store.id} (Status: ${res.statusCode})`);
      return;
    }
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`✅ Saved: ${store.id}.png`);
    });
  }).on('error', (err) => {
    console.error(`❌ Error downloading ${store.id}:`, err.message);
  });
});