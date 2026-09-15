import { collection, CollectionReference, doc, DocumentReference } from 'firebase/firestore';

import { Task } from '@/Types/Task';
import { db } from './firebase';

export type FirestoreTask = Task;

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

export function fromFirestoreTask(data: FirestoreTask): Task {
  return { ...data };
}
