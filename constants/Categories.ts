export interface CategoryInfo {
  name: string;
  emoji: string;
  color: string;
  isCustom?: boolean;
}

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { name: 'Work / Career', emoji: '💼', color: '#4A90E2' },
  { name: 'Education', emoji: '📚', color: '#7B68EE' },
  { name: 'Health & Fitness', emoji: '💪', color: '#FF6B6B' },
  { name: 'Self-Improvement', emoji: '🌱', color: '#9370DB' },
  { name: 'Creativity', emoji: '🎨', color: '#FF69B4' },
  { name: 'Personal / Life Admin', emoji: '🏠', color: '#DEB887' },
  { name: 'Finance', emoji: '💰', color: '#FFD700' },
  { name: 'Social', emoji: '👥', color: '#FF8C00' },
  { name: 'Leisure', emoji: '🎮', color: '#00CED1' },
  { name: 'Planning', emoji: '📝', color: '#CD853F' },
];

export const getCategoryInfo = (name: string, customCategories: CategoryInfo[] = []): CategoryInfo => {
  const all = [...DEFAULT_CATEGORIES, ...customCategories];
  return all.find(c => c.name === name) ||
    { name, emoji: '⭐', color: '#FFD700' };
};