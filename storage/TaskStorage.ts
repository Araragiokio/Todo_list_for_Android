import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskInput } from '@/types/Task';

const TASKS_KEY = 'tasks';

// Generate unique ID for each task
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Get all tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    const data = await AsyncStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Add a new task
export const addTask = async (input: TaskInput): Promise<Task> => {
  try {
    const tasks = await getTasks();
    const newTask: Task = {
      id: generateId(),
      name: input.name,
      category: input.category,
      priority: input.priority,
      dueDate: input.dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
      reminder: input.reminder,
    };
    const updated = [newTask, ...tasks];
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
    return newTask;
  } catch (error) {
    throw error;
  }
};

// Mark task as complete or incomplete
export const toggleTask = async (id: string): Promise<void> => {
  try {
    const tasks = await getTasks();
    const updated = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
  } catch (error) {
    throw error;
  }
};

// Delete a task
export const deleteTask = async (id: string): Promise<void> => {
  try {
    const tasks = await getTasks();
    const updated = tasks.filter(task => task.id !== id);
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
  } catch (error) {
    throw error;
  }
};

// Edit a task
export const editTask = async (id: string, input: TaskInput): Promise<void> => {
  try {
    const tasks = await getTasks();
    const updated = tasks.map(task =>
      task.id === id ? { ...task, ...input } : task
    );
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
  } catch (error) {
    throw error;
  }
};

// Get tasks by category
export const getTasksByCategory = async (category: string): Promise<Task[]> => {
  try {
    const tasks = await getTasks();
    return tasks.filter(task => task.category === category);
  } catch {
    return [];
  }
};

// Get incomplete tasks only
export const getIncompleteTasks = async (): Promise<Task[]> => {
  try {
    const tasks = await getTasks();
    return tasks.filter(task => !task.completed);
  } catch {
    return [];
  }
};

// Get today's tasks
export const getTodaysTasks = async (): Promise<Task[]> => {
  try {
    const tasks = await getTasks();
    const today = new Date().toDateString();
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate).toDateString() === today;
    });
  } catch {
    return [];
  }
};

// Clear all tasks (for testing)
export const clearAllTasks = async (): Promise<void> => {
  await AsyncStorage.removeItem(TASKS_KEY);
};