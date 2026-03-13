export type Priority = 'high' | 'medium' | 'low';

export type Category =
  | 'Study'
  | 'Assignment'
  | 'Reading'
  | 'Research'
  | 'Revision'
  | 'Online Course'
  | 'Workout'
  | 'Meditation'
  | 'Sleep Schedule'
  | 'Meal Prep'
  | 'Medicine'
  | 'Cardio'
  | 'House Chores'
  | 'Shopping'
  | 'Cooking'
  | 'Laundry'
  | 'Cleaning'
  | 'Finance'
  | 'Self Development'
  | 'Journaling'
  | 'Goal Setting'
  | 'Skill Learning'
  | 'Habit Tracking'
  | 'Social'
  | 'Gaming'
  | 'Creative'
  | 'Music Practice'
  | 'Travel Planning'
  | 'Anime'
  | 'Work'
  | 'Emails'
  | 'Meetings'
  | 'Coding'
  | 'Planning'
  | 'Prayer'
  | 'Mindfulness'
  | 'Gratitude'
  | 'Custom';

export interface Task {
  id: string;
  name: string;
  category: Category;
  priority: Priority;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  reminder: string | null;
}

export interface TaskInput {
  name: string;
  category: Category;
  priority: Priority;
  dueDate: string | null;
  reminder: string | null;
}