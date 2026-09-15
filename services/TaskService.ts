import { Task, TaskInput } from '@/Types/Task';
import { getCurrentUser, onAuthChange } from './auth';
import { saveUserTask, subscribeUserTasks } from './firestoreTasks';
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

// ---------------------------------------------------------------------------
// Existing fetch / CRUD functions (unchanged semantics)
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
  return editLocalTask(id, input);
}

export async function deleteTask(id: string): Promise<void> {
  return deleteLocalTask(id);
}

export async function toggleTask(id: string): Promise<void> {
  return toggleLocalTask(id);
}

export async function toggleSubtask(taskId: string, subtaskId: string): Promise<void> {
  return toggleLocalSubtask(taskId, subtaskId);
}

export async function updateSortOrder(tasks: Task[]): Promise<void> {
  return updateLocalSortOrder(tasks);
}

// ---------------------------------------------------------------------------
// Real‑time subscription support (Step 21)
// ---------------------------------------------------------------------------

type Callback = (tasks: Task[]) => void;

// Set of UI callbacks that want task updates. All callbacks share the same
// Firestore listener for the current authenticated UID.
const callbacks = new Set<Callback>();
let firestoreUnsub: (() => void) | null = null;
let currentUid: string | null = null;

/** Internal helper: (re)attach the Firestore listener for the given UID */
function attachListener(uid: string) {
  if (firestoreUnsub) return; // already attached for this UID
  firestoreUnsub = subscribeUserTasks(uid, (tasks) => {
    // Propagate the snapshot to all registered UI callbacks.
    callbacks.forEach((cb) => cb(tasks));
  });
}

/** Internal helper: clean up the existing Firestore listener */
function detachListener() {
  if (firestoreUnsub) {
    firestoreUnsub();
    firestoreUnsub = null;
  }
}

/** React to auth UID changes – ensure the old listener is removed before a new one is created. */
function handleAuthChange(uid: string | null) {
  if (uid === currentUid) return; // no change
  // Clean up previous listener (if any) and reset state.
  detachListener();
  currentUid = uid;
  // If there are active UI subscribers and we now have an authenticated UID, attach.
  if (uid && callbacks.size > 0) {
    attachListener(uid);
  }
}

// Register a global auth state observer exactly once.
onAuthChange((user) => {
  handleAuthChange(user?.uid ?? null);
});

/**
 * Subscribe a UI component to real‑time task updates.
 * Returns an unsubscribe function that removes only the caller's callback.
 * Guest users receive a one‑time snapshot from local storage and never create a Firestore listener.
 */
export function subscribeToTasks(cb: Callback): () => void {
  callbacks.add(cb);

  // Guest mode – no UID, just load the current local tasks once.
  if (!currentUid) {
    // Load from local storage (AsyncStorage) to give an initial view.
    fetchTasks().then(cb);
    return () => {
      callbacks.delete(cb);
    };
  }

  // Authenticated – ensure the Firestore listener is attached.
  if (!firestoreUnsub) {
    attachListener(currentUid!);
  }

  // Return a cleanup function for this subscriber.
  return () => {
    callbacks.delete(cb);
    // If this was the last subscriber, detach the Firestore listener.
    if (callbacks.size === 0) {
      detachListener();
    }
  };
}
