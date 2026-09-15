import { updateProfile } from 'firebase/auth';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { auth, storage } from './firebase';
import {
  ensureUserDocument,
  getUserPhotoURL,
  updateUserPhotoURL,
} from './firestoreUsers';

const PROFILE_IMAGE_PATH = 'profile.jpg';

export class ProfilePictureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfilePictureError';
  }
}

function requireSignedInUser() {
  const user = auth.currentUser;
  if (!user) {
    throw new ProfilePictureError('You need to sign in to update your profile picture.');
  }
  return user;
}

function assertStillSameUser(uid: string) {
  if (auth.currentUser?.uid !== uid) {
    throw new ProfilePictureError('Signed out before the picture could be saved.');
  }
}

function withCacheBust(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

function isAppStorageUrl(url: string, uid: string): boolean {
  return url.includes(`/users%2F${uid}%2F`) || url.includes(`/users/${uid}/`);
}

async function deletePreviousStorageImage(previousUrl: string, uid: string) {
  if (!isAppStorageUrl(previousUrl, uid)) {
    return;
  }

  try {
    await deleteObject(ref(storage, previousUrl));
  } catch {
    // Best-effort cleanup only; the new picture is already saved.
  }
}

export async function getMyProfilePhotoURL(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  return getUserPhotoURL(user.uid);
}

export async function uploadAndSaveProfilePicture(localUri: string): Promise<string> {
  const user = requireSignedInUser();
  const uid = user.uid;
  const previousUrl = await getUserPhotoURL(uid);

  let blob: Blob;
  try {
    const response = await fetch(localUri);
    if (!response.ok) {
      throw new Error('Could not read the selected image.');
    }
    blob = await response.blob();
  } catch {
    throw new ProfilePictureError('Could not read the selected image.');
  }

  if (
    blob.type &&
    !blob.type.startsWith('image/') &&
    blob.type !== 'application/octet-stream'
  ) {
    throw new ProfilePictureError('Please choose a valid image.');
  }

  assertStillSameUser(uid);

  const objectRef = ref(storage, `users/${uid}/${Date.now()}-${PROFILE_IMAGE_PATH}`);

  try {
    await uploadBytes(objectRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });
  } catch {
    throw new ProfilePictureError('Could not upload the profile picture. Check your connection and try again.');
  }

  assertStillSameUser(uid);

  let downloadURL: string;
  try {
    downloadURL = withCacheBust(await getDownloadURL(objectRef));
  } catch {
    throw new ProfilePictureError('Could not upload the profile picture. Check your connection and try again.');
  }

  assertStillSameUser(uid);

  try {
    await ensureUserDocument(user);
    await updateUserPhotoURL(uid, downloadURL);
  } catch {
    try {
      await deleteObject(objectRef);
    } catch {
      // Leave the unused upload; the previous Firestore photoURL is unchanged.
    }
    throw new ProfilePictureError('Could not save the profile picture. Your previous picture was kept.');
  }

  if (previousUrl) {
    await deletePreviousStorageImage(previousUrl, uid);
  }

  if (auth.currentUser?.uid === uid) {
    try {
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
    } catch {
      // Firestore is the source of truth for the custom picture.
    }
  }

  return downloadURL;
}
