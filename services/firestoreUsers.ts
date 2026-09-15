import { User } from 'firebase/auth';
import {
    doc,
    DocumentReference,
    FieldValue,
    getDoc,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';

import { db } from './firebase';

// Security rules assumption:
// allow read, write: if request.auth.uid == userId
export interface UserProfileDocument {
  uid: string;
  name: string | null;
  email: string | null;
  createdAt: FieldValue;
}

export function getUserDocRef(uid: string): DocumentReference<UserProfileDocument> {
  return doc(db, 'users', uid) as DocumentReference<UserProfileDocument>;
}

export async function ensureUserDocument(user: User): Promise<void> {
  const userRef = getUserDocRef(user.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    return;
  }

  const payload: UserProfileDocument = {
    uid: user.uid,
    name: user.displayName ?? null,
    email: user.email ?? null,
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, payload);
}
