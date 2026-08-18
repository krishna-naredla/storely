import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const q = query(collection(db, 'businesses'), where('slug', '==', 'nmk-fashions'), limit(1));
    const snap = await getDocs(q);
    console.log("Success! Matches:", snap.size);
  } catch (err) {
    console.error("Firestore Query Error:", err);
  }
}
run();
