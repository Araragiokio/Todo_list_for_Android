import { Subtask, Task, TaskInput } from '@/types/Task';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_KEY = 'tasks';
const CUSTOM_CATEGORIES_KEY = 'custom_categories';
const CUSTOM_CATEGORY_WARNING_KEY = 'custom_category_warning_shown';

const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// ─── Tasks ────────────────────────────────────────────────

export const getTasks = async (): Promise<Task[]> => {
  try {
    const data = await AsyncStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addTask = async (input: TaskInput): Promise<Task> => {
  try {
    const tasks = await getTasks();
    const newTask: Task = {
      id: generateId(),
      title: input.title,
      category: input.category,
      tags: input.tags,
      energyLevel: input.energyLevel,
      priority: input.priority,
      dueDate: input.dueDate,
      reminder: input.reminder,
      notes: input.notes,
      subtasks: input.subtasks,
      completed: false,
      createdAt: new Date().toISOString(),
      recurring: input.recurring,
      recurringDay: input.recurringDay,
      sortOrder: tasks.length,
    };
    const updated = [newTask, ...tasks];
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
    return newTask;
  } catch (error) {
    throw error;
  }
};

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

export const deleteTask = async (id: string): Promise<void> => {
  try {
    const tasks = await getTasks();
    const updated = tasks.filter(task => task.id !== id);
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
  } catch (error) {
    throw error;
  }
};

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

export const toggleSubtask = async (taskId: string, subtaskId: string): Promise<void> => {
  try {
    const tasks = await getTasks();
    const updated = tasks.map(task => {
      if (task.id !== taskId) return task;
      const updatedSubtasks = task.subtasks.map((s: Subtask) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      );
      const allDone = updatedSubtasks.every((s: Subtask) => s.completed);
      return {
        ...task,
        subtasks: updatedSubtasks,
        completed: allDone,
      };
    });
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
  } catch (error) {
    throw error;
  }
};

export const updateSortOrder = async (tasks: Task[]): Promise<void> => {
  try {
    const reordered = tasks.map((task, index) => ({
      ...task,
      sortOrder: index,
    }));
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(reordered));
  } catch (error) {
    throw error;
  }
};

// ─── Recurring Tasks ──────────────────────────────────────

export const getActiveTasks = async (): Promise<Task[]> => {
  try {
    const tasks = await getTasks();
    const today = new Date();
    const todayStr = today.toDateString();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayOfMonth = today.getDate();

    return tasks.filter(task => {
      // Non-recurring tasks always show
      if (!task.recurring) return true;

      // Recurring — only show if today matches the rule
      if (task.recurring === 'daily') return true;
      if (task.recurring === 'weekly') {
        return task.recurringDay?.toLowerCase() === dayName;
      }
      if (task.recurring === 'monthly') {
        return task.recurringDay === dayOfMonth.toString();
      }
      if (task.recurring === 'yearly') {
        const due = task.dueDate ? new Date(task.dueDate) : null;
        if (!due) return false;
        return due.getDate() === today.getDate() &&
               due.getMonth() === today.getMonth();
      }
      return false;
    });
  } catch {
    return [];
  }
};

// ─── Custom Categories ────────────────────────────────────

export const getCustomCategories = async () => {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addCustomCategory = async (name: string, emoji: string) => {
  try {
    const existing = await getCustomCategories();
    const newCat = { name, emoji, color: '#6C63FF', isCustom: true };
    const updated = [...existing, newCat];
    await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
    return newCat;
  } catch (error) {
    throw error;
  }
};

export const deleteCustomCategory = async (name: string) => {
  try {
    const existing = await getCustomCategories();
    const updated = existing.filter((c: any) => c.name !== name);
    await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
  } catch (error) {
    throw error;
  }
};

export const hasShownCustomCategoryWarning = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(CUSTOM_CATEGORY_WARNING_KEY);
    return val === 'true';
  } catch {
    return false;
  }
};

export const markCustomCategoryWarningShown = async (): Promise<void> => {
  await AsyncStorage.setItem(CUSTOM_CATEGORY_WARNING_KEY, 'true');
};

// ─── Search ───────────────────────────────────────────────

export const searchTasks = async (query: string): Promise<Task[]> => {
  try {
    const tasks = await getActiveTasks();
    const q = query.toLowerCase().trim();
    if (!q) return tasks;
    return tasks.filter(task =>
      task.title.toLowerCase().includes(q) ||
      task.category.toLowerCase().includes(q) ||
      task.notes.toLowerCase().includes(q) ||
      task.tags.some(tag => tag.toLowerCase().includes(q))
    );
  } catch {
    return [];
  }
};

// ─── Stats (for profile/badges) ───────────────────────────

export const getCompletedCount = async (): Promise<number> => {
  const tasks = await getTasks();
  return tasks.filter(t => t.completed).length;
};

export const getTodayCompletedCount = async (): Promise<number> => {
  const tasks = await getTasks();
  const today = new Date().toDateString();
  return tasks.filter(t =>
    t.completed &&
    new Date(t.createdAt).toDateString() === today
  ).length;
};