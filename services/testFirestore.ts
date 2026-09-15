import { User } from 'firebase/auth';
import { deleteDoc, getDoc, setDoc } from 'firebase/firestore';

import { Task } from '@/Types/Task';
import { getUserTaskDocRef, toFirestoreTask } from './firestoreTasks';
import { ensureUserDocument, getUserDocRef } from './firestoreUsers';

const TEST_TASK_PREFIX = '__firestore_test__';

export async function runFirestoreSmokeTest(user: User): Promise<void> {
  await ensureUserDocument(user);

  const userRef = getUserDocRef(user.uid);
  const userSnapshot = await getDoc(userRef);
  if (!userSnapshot.exists()) {
    throw new Error('Firestore user document missing after ensureUserDocument().');
  }

  const taskId = `${TEST_TASK_PREFIX}${Date.now()}`;
  const now = new Date().toISOString();
  const task: Task = {
    id: taskId,
    title: 'Firestore smoke test',
    category: 'General',
    tags: [],
    energyLevel: null,
    priority: 'low',
    dueDate: null,
    reminder: null,
    notes: '',
    subtasks: [],
    completed: false,
    createdAt: now,
    recurring: null,
    recurringDay: null,
    sortOrder: 0,
  };

  const taskRef = getUserTaskDocRef(user.uid, taskId);
  await setDoc(taskRef, toFirestoreTask(task));
  await deleteDoc(taskRef);
}
