import { DEFAULT_CATEGORIES, getCategoryInfo } from '@/constants/Categories';
import { useTheme } from '@/context/ThemeContext';
import {
  deleteTask,
  getActiveTasks,
  getCustomCategories,
  toggleTask
} from '@/storage/TaskStorage';
import { Task } from '@/types/Task';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

type SortType = 'due_date' | 'priority' | 'energy' | 'created' | 'manual';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const ENERGY_ORDER = { deep_work: 0, focus: 1, quick_task: 2, low_energy: 3 };

export default function HomeScreen() {
  const { colors, theme, setTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortType>('created');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [customCategories, setCustomCategories] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  const loadAll = async () => {
    const loaded = await getActiveTasks();
    const custom = await getCustomCategories();
    setTasks(loaded);
    setCustomCategories(custom);
  };

  const handleToggle = async (id: string) => {
    await toggleTask(id);
    loadAll();
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteTask(id);
          loadAll();
        }
      }
    ]);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getPriorityColor = (p: string) => {
    if (p === 'high') return colors.danger;
    if (p === 'medium') return colors.warning;
    return colors.success;
  };

  const getEnergyLabel = (e: string | null) => {
    if (!e) return null;
    const map: any = {
      deep_work: '🧠 Deep Work',
      quick_task: '⚡ Quick',
      low_energy: '💤 Low Energy',
      focus: '🎯 Focus',
    };
    return map[e] || null;
  };

  // Filter + sort logic
  const allCategories = ['All', ...DEFAULT_CATEGORIES.map(c => c.name), ...customCategories.map(c => c.name)];

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'All' || task.category === filter;
    const matchesSearch = search === '' ||
      (task.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (task.category ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (task.notes ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (task.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const activeTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const sortedActive = [...activeTasks].sort((a, b) => {
    if (sort === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (sort === 'energy') return (ENERGY_ORDER[a.energyLevel as keyof typeof ENERGY_ORDER] ?? 9) - (ENERGY_ORDER[b.energyLevel as keyof typeof ENERGY_ORDER] ?? 9);
    if (sort === 'due_date') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sort === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return a.sortOrder - b.sortOrder;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? completedCount / tasks.length : 0;

  const sortLabel = {
    due_date: 'Due Date',
    priority: 'Priority',
    energy: 'Energy',
    created: 'Created',
    manual: 'Manual',
  }[sort];

  const renderTask = ({ item }: { item: Task }) => {
    const catInfo = getCategoryInfo(item.category, customCategories);
    return (
      <View key={item.id} style={[styles.taskCard, { backgroundColor: colors.card }]}>
        <View style={[styles.priorityStrip, { backgroundColor: getPriorityColor(item.priority) }]} />
        <View style={styles.taskContent}>
          <Text style={[
            styles.taskTitle,
            { color: colors.text },
            item.completed && { textDecorationLine: 'line-through', opacity: 0.5 }
          ]}>
            {item.title}
          </Text>
          <View style={styles.taskMeta}>
            <Text style={{ fontSize: 12 }}>{catInfo.emoji}</Text>
            <Text style={[styles.metaText, { color: colors.subtext }]}>{item.category}</Text>
            {item.dueDate && (
              <Text style={[styles.metaText, { color: colors.subtext }]}>
                · {new Date(item.dueDate).toLocaleDateString()}
              </Text>
            )}
            {item.energyLevel && (
              <Text style={[styles.metaText, { color: colors.accent }]}>
                · {getEnergyLabel(item.energyLevel)}
              </Text>
            )}
          </View>
            {(item.tags ?? []).length > 0 && (
            <View style={styles.tagRow}>
              {(item.tags ?? []).map(tag => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.accent + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.accent }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          {(item.subtasks ?? []).length > 0 && (
            <Text style={[styles.subtaskProgress, { color: colors.subtext }]}
            >
              {(item.subtasks ?? []).filter(s => s.completed).length}/{(item.subtasks ?? []).length} subtasks
            </Text>
          )}
        </View>
        <View style={styles.taskActions}>
          <TouchableOpacity
            onPress={() => handleToggle(item.id)}
            style={[styles.checkBtn, {
              backgroundColor: item.completed ? colors.accent : 'transparent',
              borderColor: colors.accent,
            }]}
          >
            {item.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Sakura background */}
      <LottieView
        source={require('@/assets/animations/Cherry-Blossom.json')}
        autoPlay
        loop
        style={[StyleSheet.absoluteFillObject, { opacity: 0.52 }]}
        resizeMode="cover"
        speed={0.4}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.subtext} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search tasks, tags, categories..."
            placeholderTextColor={colors.subtext}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.subtext} />
            </TouchableOpacity>
          )}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.subtext }]}>{getGreeting()},</Text>
            <Text style={[styles.name, { color: colors.text }]}>Araragi 👋</Text>
            <Text style={[styles.streak, { color: colors.accent }]}>🔥 Keep your streak going!</Text>
          </View>
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: colors.card }]}
            onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.text }]}>Today's Progress</Text>
            <Text style={[styles.progressCount, { color: colors.accent }]}>
              {completedCount}/{tasks.length} tasks
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${progress * 100}%` }]} />
          </View>
        </View>

        {/* Category chips + Sort */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={styles.chips}>
              {allCategories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, {
                    backgroundColor: filter === cat ? colors.accent : colors.card,
                    borderColor: colors.accent,
                  }]}
                  onPress={() => setFilter(cat)}
                >
                  <Text style={[styles.chipText, { color: filter === cat ? '#fff' : colors.accent }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity
            style={[styles.sortBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowSortMenu(true)}
          >
            <Text style={[styles.sortText, { color: colors.accent }]}>{sortLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Active tasks */}
        {sortedActive.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>Active</Text>
            {sortedActive.map(task => renderTask({ item: task }))}
          </>
        )}

        {/* Empty state */}
        {sortedActive.length === 0 && completedTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🗡️</Text>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>No tasks yet. Add one!</Text>
          </View>
        )}

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.completedHeader}
              onPress={() => setShowCompleted(!showCompleted)}
            >
              <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
                Completed ({completedTasks.length})
              </Text>
              <Ionicons
                name={showCompleted ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.subtext}
              />
            </TouchableOpacity>
            {showCompleted && completedTasks.map(task => renderTask({ item: task }))}
          </>
        )}

      </ScrollView>

      {/* Floating + button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => router.push('/(tabs)/addtask')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Sort modal */}
      <Modal visible={showSortMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowSortMenu(false)}>
          <View style={[styles.sortMenu, { backgroundColor: colors.card }]}>
            {([
              ['due_date', 'Due Date', 'calendar-outline'],
              ['priority', 'Priority', 'flag-outline'],
              ['energy', 'Energy Level', 'flash-outline'],
              ['created', 'Created Time', 'time-outline'],
              ['manual', 'Manual', 'reorder-three-outline'],
            ] as const).map(([key, label, icon]) => (
              <TouchableOpacity
                key={key}
                style={[styles.sortOption, {
                  backgroundColor: sort === key ? colors.accent + '20' : 'transparent',
                }]}
                onPress={() => { setSort(key); setShowSortMenu(false); }}
              >
                <Ionicons name={icon} size={18} color={sort === key ? colors.accent : colors.text} />
                <Text style={[styles.sortOptionText, {
                  color: sort === key ? colors.accent : colors.text,
                  fontWeight: sort === key ? '600' : '400',
                }]}>
                  {label}
                </Text>
                {sort === key && <Ionicons name="checkmark" size={16} color={colors.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sakura: {
    position: 'absolute',
    top: 0, left: 0,
    width, height,
    opacity: 0.08,
    zIndex: 0,
  },
  scroll: { flex: 1, paddingTop: 60, paddingHorizontal: 20, zIndex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: { fontSize: 13 },
  name: { fontSize: 22, fontWeight: 'bold' },
  streak: { fontSize: 12, marginTop: 2 },
  themeBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  progressCard: {
    borderRadius: 16, padding: 14, marginBottom: 14,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  progressCount: { fontSize: 13, fontWeight: '600' },
  progressBar: { height: 7, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 7, borderRadius: 4 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  chips: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, height: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, height: 34,
  },
  sortText: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  taskCard: {
    flexDirection: 'row', borderRadius: 14,
    marginBottom: 10, overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3,
  },
  priorityStrip: { width: 4 },
  taskContent: { flex: 1, padding: 12 },
  taskTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 12 },
  tagRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '500' },
  subtaskProgress: { fontSize: 11, marginTop: 4 },
  taskActions: {
    alignItems: 'center', justifyContent: 'center',
    paddingRight: 12, gap: 10,
  },
  checkBtn: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  completedHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyText: { fontSize: 16 },
  fab: {
    position: 'absolute', bottom: 80, right: 20,
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, zIndex: 10,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  sortMenu: {
    width: 220, borderRadius: 16,
    padding: 8, elevation: 10,
  },
  sortOption: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, padding: 12, borderRadius: 10,
  },
  sortOptionText: { flex: 1, fontSize: 14 },
});