export type Priority = 'high' | 'medium' | 'low';

export type EnergyLevel = 'deep_work' | 'quick_task' | 'low_energy' | 'focus';

export type RecurringType = 'daily' | 'weekly' | 'monthly' | 'yearly' | null;

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  tags: string[];
  energyLevel: EnergyLevel | null;
  priority: Priority;
  dueDate: string | null;
  reminder: string | null;
  notes: string;
  subtasks: Subtask[];
  completed: boolean;
  createdAt: string;
  recurring: RecurringType;
  recurringDay: string | null;
  sortOrder: number;
}

export interface TaskInput {
  title: string;
  category: string;
  tags: string[];
  energyLevel: EnergyLevel | null;
  priority: Priority;
  dueDate: string | null;
  reminder: string | null;
  notes: string;
  subtasks: Subtask[];
  recurring: RecurringType;
  recurringDay: string | null;
}