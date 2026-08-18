import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const snap = await getDocs(collection(db, 'businesses'));
    console.log("All Businesses in DB:");
    snap.forEach(doc => {
      console.log(`- ID: ${doc.id}, Name: ${doc.data().name}, Slug: ${doc.data().slug}, Published: ${doc.data().isPublished}, Owner: ${doc.data().ownerId}`);
    });
  } catch (err) {
    console.error("Firestore Query Error:", err);
  }
  process.exit(0);
}
run();
