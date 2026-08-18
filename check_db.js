import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const snap = await getDocs(collection(db, 'businesses'));
  console.log("Total businesses in DB:", snap.size);
  snap.forEach(doc => {
    console.log(`- ID: ${doc.id}, Name: ${doc.data().name}, Slug: ${doc.data().slug}, Published: ${doc.data().isPublished}`);
  });
  process.exit(0);
}
run();
