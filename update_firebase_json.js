import fs from 'fs';
const data = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
data.firestore.indexes = "firestore.indexes.json";
fs.writeFileSync('firebase.json', JSON.stringify(data, null, 2));
