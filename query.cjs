const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const q = collection(db, 'businesses');
  const snap = await getDocs(q);
  console.log("Businesses:");
  snap.forEach(doc => console.log(doc.id, doc.data().slug, doc.data().name));
}
run().catch(console.error);
