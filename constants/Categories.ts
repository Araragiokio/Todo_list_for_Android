export interface CategoryInfo {
  name: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { name: 'Study', emoji: '📚', color: '#4A90E2' },
  { name: 'Assignment', emoji: '✍️', color: '#7B68EE' },
  { name: 'Reading', emoji: '📖', color: '#5B9BD5' },
  { name: 'Research', emoji: '🔬', color: '#4169E1' },
  { name: 'Revision', emoji: '🧮', color: '#6495ED' },
  { name: 'Online Course', emoji: '🎓', color: '#1E90FF' },
  { name: 'Workout', emoji: '💪', color: '#FF6B6B' },
  { name: 'Meditation', emoji: '🧘', color: '#98D8C8' },
  { name: 'Sleep Schedule', emoji: '😴', color: '#B19CD9' },
  { name: 'Meal Prep', emoji: '🥗', color: '#90EE90' },
  { name: 'Medicine', emoji: '💊', color: '#FFB6C1' },
  { name: 'Cardio', emoji: '🏃', color: '#FFA07A' },
  { name: 'House Chores', emoji: '🏠', color: '#DEB887' },
  { name: 'Shopping', emoji: '🛒', color: '#F0E68C' },
  { name: 'Cooking', emoji: '🍳', color: '#FFA500' },
  { name: 'Laundry', emoji: '👕', color: '#87CEEB' },
  { name: 'Cleaning', emoji: '🧹', color: '#98FB98' },
  { name: 'Finance', emoji: '💰', color: '#FFD700' },
  { name: 'Self Development', emoji: '💪', color: '#9370DB' },
  { name: 'Journaling', emoji: '📓', color: '#DDA0DD' },
  { name: 'Goal Setting', emoji: '🎯', color: '#FF69B4' },
  { name: 'Skill Learning', emoji: '🧠', color: '#20B2AA' },
  { name: 'Habit Tracking', emoji: '📿', color: '#9932CC' },
  { name: 'Social', emoji: '👥', color: '#FF8C00' },
  { name: 'Gaming', emoji: '🎮', color: '#00CED1' },
  { name: 'Creative', emoji: '🎨', color: '#FF1493' },
  { name: 'Music Practice', emoji: '🎵', color: '#8A2BE2' },
  { name: 'Travel Planning', emoji: '✈️', color: '#00BFFF' },
  { name: 'Anime', emoji: '🌸', color: '#FF69B4' },
  { name: 'Work', emoji: '💼', color: '#708090' },
  { name: 'Emails', emoji: '📧', color: '#4682B4' },
  { name: 'Meetings', emoji: '📊', color: '#2E8B57' },
  { name: 'Coding', emoji: '🖥️', color: '#6C63FF' },
  { name: 'Planning', emoji: '📝', color: '#CD853F' },
  { name: 'Prayer', emoji: '🙏', color: '#DAA520' },
  { name: 'Mindfulness', emoji: '☮️', color: '#3CB371' },
  { name: 'Gratitude', emoji: '🌿', color: '#228B22' },
  { name: 'Custom', emoji: '⭐', color: '#FFD700' },
];

export const getCategoryInfo = (name: string): CategoryInfo => {
  return CATEGORIES.find(c => c.name === name) || 
    { name: 'Custom', emoji: '⭐', color: '#FFD700' };
};