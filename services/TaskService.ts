import { Task, TaskInput } from '@/Types/Task';
import { getCurrentUser, onAuthChange } from './auth';
import { deleteUserTask, saveUserTask, subscribeUserTasks } from './firestoreTasks';
import {
  addTask as addLocalTask,
  deleteTask as deleteLocalTask,
  editTask as editLocalTask,
  getActiveTasks as getLocalActiveTasks,
  getTasks as getLocalTasks,
  toggleSubtask as toggleLocalSubtask,
  toggleTask as toggleLocalTask,
  updateSortOrder as updateLocalSortOrder,
} from '@/storage/TaskStorage';

export { filterRecurringTasks } from '@/storage/TaskStorage';

// ---------------------------------------------------------------------------
// Existing fetch / CRUD functions (mirrored to Firestore when authenticated)
// ---------------------------------------------------------------------------
export async function fetchTasks(): Promise<Task[]> {
  return getLocalTasks();
}

export async function fetchActiveTasks(): Promise<Task[]> {
  return getLocalActiveTasks();
}

export async function addTask(input: TaskInput): Promise<Task> {
  const task = await addLocalTask(input);
  const user = getCurrentUser();

  if (user) {
    await saveUserTask(user.uid, task);
  }

  return task;
}

export async function updateTask(id: string, input: TaskInput): Promise<void> {
  await editLocalTask(id, input);
  const user = getCurrentUser();
  if (user) {
    const all = await getLocalTasks();
    const updated = all.find(t => t.id === id);
    if (updated) {
      await saveUserTask(user.uid, updated);
    }
  }
}

export async function deleteTask(id: string): Promise<void> {
  await deleteLocalTask(id);
  const user = getCurrentUser();
  if (user) {
    await deleteUserTask(user.uid, id);
  }
}

export async function toggleTask(id: string): Promise<void> {
  await toggleLocalTask(id);
  const user = getCurrentUser();
  if (user) {
    const all = await getLocalTasks();
    const updated = all.find(t => t.id === id);
    if (updated) {
      await saveUserTask(user.uid, updated);
    }
  }
}

export async function toggleSubtask(taskId: string, subtaskId: string): Promise<void> {
  await toggleLocalSubtask(taskId, subtaskId);
  const user = getCurrentUser();
  if (user) {
    const all = await getLocalTasks();
    const updated = all.find(t => t.id === taskId);
    if (updated) {
      await saveUserTask(user.uid, updated);
    }
  }
}

export async function updateSortOrder(tasks: Task[]): Promise<void> {
  await updateLocalSortOrder(tasks);
  const user = getCurrentUser();
  if (user) {
    for (const task of tasks) {
      await saveUserTask(user.uid, task);
    }
  }
}

// ---------------------------------------------------------------------------
// Real‑time subscription support (Step 21)
// ---------------------------------------------------------------------------

type Callback = (tasks: Task[]) => void;

// Set of UI callbacks that want task updates. All callbacks share the same
// Firestore listener for the current authenticated UID.
const callbacks = new Set<Callback>();
let firestoreUnsub: (() => void) | null = null;
let currentListenerUid: string | null = null;
let currentAuthUid: string | null = getCurrentUser()?.uid ?? null;
let isAuthResolved = false;
let lastKnownTasks: Task[] | null = null;

/** Internal helper: attach the Firestore listener for the given UID */
function attachListener(uid: string) {
  if (firestoreUnsub && currentListenerUid === uid) {
    return; // already attached for this UID
  }
  if (firestoreUnsub) {
    detachListener();
  }

  currentListenerUid = uid;
  firestoreUnsub = subscribeUserTasks(
    uid,
    (tasks) => {
      lastKnownTasks = tasks;
      callbacks.forEach((cb) => {
        try {
          cb(tasks);
        } catch (err) {
          console.error('Error in TaskService subscriber callback:', err);
        }
      });
    },
    (error) => {
      console.error(`Firestore snapshot error for user ${uid}:`, error);
    }
  );
}

/** Internal helper: clean up the existing Firestore listener */
function detachListener() {
  if (firestoreUnsub) {
    try {
      firestoreUnsub();
    } catch (err) {
      console.error('Error detaching Firestore listener:', err);
    }
    firestoreUnsub = null;
  }
  currentListenerUid = null;
}

/** React to auth state changes */
function handleAuthChange(uid: string | null) {
  const uidChanged = uid !== currentAuthUid;
  currentAuthUid = uid;
  isAuthResolved = true;

  if (uid) {
    // Authenticated user
    if (uidChanged || !firestoreUnsub) {
      if (uidChanged) {
        detachListener();
        lastKnownTasks = null;
      }
      if (callbacks.size > 0) {
        attachListener(uid);
      }
    }
  } else {
    // Guest / logged out
    detachListener();
    lastKnownTasks = null;
    if (callbacks.size > 0) {
      // Notify existing subscribers with local tasks for guest mode
      fetchTasks()
        .then((tasks) => {
          if (currentAuthUid === null) {
            callbacks.forEach((cb) => {
              try {
                cb(tasks);
              } catch (err) {
                console.error('Error in TaskService guest callback:', err);
              }
            });
          }
        })
        .catch((err) => console.error('Error fetching local tasks on logout:', err));
    }
  }
}

// Register global auth state listener exactly once
onAuthChange((user) => {
  handleAuthChange(user?.uid ?? null);
});

/**
 * Subscribe a UI component to real‑time task updates.
 * Returns an unsubscribe function that removes only the caller's callback.
 * Guest users receive local tasks and never create a Firestore listener.
 */
export function subscribeToTasks(cb: Callback): () => void {
  callbacks.add(cb);

  if (!isAuthResolved) {
    // Auth state is initially unresolved (Firebase session restoring).
    // If currentAuthUid is already known, attach listener immediately.
    if (currentAuthUid) {
      if (!firestoreUnsub) {
        attachListener(currentAuthUid);
      } else if (lastKnownTasks) {
        cb(lastKnownTasks);
      }
    } else {
      // Provide initial local tasks to avoid an empty flash while auth resolves
      fetchTasks()
        .then((tasks) => {
          if (!firestoreUnsub && callbacks.has(cb) && currentAuthUid === null) {
            cb(tasks);
          }
        })
        .catch(() => {});
    }
  } else if (currentAuthUid) {
    // Auth is resolved and user is authenticated
    if (!firestoreUnsub) {
      attachListener(currentAuthUid);
    } else if (lastKnownTasks) {
      cb(lastKnownTasks);
    }
  } else {
    // Auth is resolved and user is definitely Guest. Zero Firestore listeners.
    fetchTasks()
      .then((tasks) => {
        if (callbacks.has(cb) && currentAuthUid === null) {
          cb(tasks);
        }
      })
      .catch(() => {});
  }

  return () => {
    callbacks.delete(cb);
    // If this was the last subscriber, detach the Firestore listener
    if (callbacks.size === 0) {
      detachListener();
      lastKnownTasks = null;
    }
  };
}
