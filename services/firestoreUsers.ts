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
  photoURL?: string | null;
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
    photoURL: user.photoURL ?? null,
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, payload);
}

export async function getUserPhotoURL(uid: string): Promise<string | null> {
  const snapshot = await getDoc(getUserDocRef(uid));
  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data().photoURL ?? null;
}

export async function updateUserPhotoURL(uid: string, photoURL: string): Promise<void> {
  await setDoc(getUserDocRef(uid), { photoURL }, { merge: true });
}
