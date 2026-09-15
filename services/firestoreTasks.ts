import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  getDocs,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';

import { Task } from '@/Types/Task';
import { db } from './firebase';

type FirestoreDateValue = string | null | Date | { toDate: () => Date };

export type FirestoreTask = Omit<Task, 'createdAt' | 'dueDate' | 'reminder'> & {
  createdAt: FirestoreDateValue;
  dueDate: FirestoreDateValue;
  reminder: FirestoreDateValue;
};

// Task documents mirror the Task interface (ISO string dates for dueDate/reminder/createdAt).
export function getUserTasksCollectionRef(uid: string): CollectionReference<FirestoreTask> {
  return collection(db, 'users', uid, 'tasks') as CollectionReference<FirestoreTask>;
}

export function getUserTaskDocRef(uid: string, taskId: string): DocumentReference<FirestoreTask> {
  return doc(db, 'users', uid, 'tasks', taskId) as DocumentReference<FirestoreTask>;
}

export function toFirestoreTask(task: Task): FirestoreTask {
  return { ...task };
}

function toIsoString(value: FirestoreDateValue): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value.toDate().toISOString();
}

export function fromFirestoreTask(data: FirestoreTask, id = data.id): Task {
  return {
    ...data,
    id,
    createdAt: toIsoString(data.createdAt) ?? new Date().toISOString(),
    dueDate: toIsoString(data.dueDate),
    reminder: toIsoString(data.reminder),
  };
}

export async function saveUserTask(uid: string, task: Task): Promise<void> {
  const taskRef = getUserTaskDocRef(uid, task.id);
  await setDoc(taskRef, toFirestoreTask(task));
}

export async function fetchUserTasks(uid: string): Promise<Task[]> {
  const tasksSnapshot = await getDocs(getUserTasksCollectionRef(uid));
  return tasksSnapshot.docs
    .map(taskDoc => fromFirestoreTask(taskDoc.data(), taskDoc.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Subscribe to real‑time updates of a user's tasks.
 * Returns an unsubscribe function that detaches the Firestore listener.
 */
export function subscribeUserTasks(
  uid: string,
  onChange: (tasks: Task[]) => void,
): () => void {
  const unsub = onSnapshot(getUserTasksCollectionRef(uid), (snapshot) => {
    const tasks = snapshot.docs
      .map((doc) => fromFirestoreTask(doc.data(), doc.id))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    onChange(tasks);
  });
  return unsub;
}

