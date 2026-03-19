const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function loadServiceAccount() {
  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccountPath) {
    throw new Error(
      'Missing service account. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS to a JSON key file path.'
    );
  }
  const fullPath = path.resolve(serviceAccountPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Service account file not found: ${fullPath}`);
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function initAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }
  const serviceAccount = loadServiceAccount();
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function removeSchoolField(collectionName) {
  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;
  const docId = admin.firestore.FieldPath.documentId();

  let lastDoc = null;
  let totalScanned = 0;
  let totalUpdated = 0;

  while (true) {
    let query = db.collection(collectionName).orderBy(docId).limit(500);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    const batch = db.batch();
    let batchUpdates = 0;

    snapshot.docs.forEach((doc) => {
      totalScanned += 1;
      const data = doc.data();
      if (Object.prototype.hasOwnProperty.call(data, 'school')) {
        batch.update(doc.ref, { school: FieldValue.delete() });
        batchUpdates += 1;
        totalUpdated += 1;
      }
    });

    if (batchUpdates > 0) {
      await batch.commit();
    }
  }

  return { totalScanned, totalUpdated };
}

async function main() {
  initAdmin();
  const collections = ['users', 'scores'];

  for (const name of collections) {
    const { totalScanned, totalUpdated } = await removeSchoolField(name);
    console.log(
      `[${name}] scanned=${totalScanned} updated=${totalUpdated} (school removed)`
    );
  }
}

main().catch((error) => {
  console.error('Cleanup failed:', error.message || error);
  process.exit(1);
});
