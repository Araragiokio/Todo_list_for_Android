import { Task, TaskInput } from '@/Types/Task';
import { getCurrentUser } from './auth';
import { saveUserTask } from './firestoreTasks';
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
