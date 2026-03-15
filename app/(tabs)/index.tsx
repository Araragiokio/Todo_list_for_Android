import { DEFAULT_CATEGORIES, getCategoryInfo } from '@/constants/Categories';
import { useTheme } from '@/context/ThemeContext';
import {
  deleteTask,
  getActiveTasks,
  getCustomCategories,
  getTasks,
  toggleSubtask,
  toggleTask,
  updateSortOrder,
} from '@/storage/TaskStorage';
import { Task } from '@/types/Task';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Reanimated, { SlideInDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type SortType = 'due_date' | 'priority' | 'energy' | 'created' | 'manual';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const ENERGY_ORDER = { deep_work: 0, focus: 1, quick_task: 2, low_energy: 3 };

export default function HomeScreen() {
  const { colors, theme, setTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showSingleComplete, setShowSingleComplete] = useState(false);
  const [showAllComplete, setShowAllComplete] = useState(false);
  const [sort, setSort] = useState<SortType>('created');
  const [manualOrderedActive, setManualOrderedActive] = useState<Task[]>([]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [sparkleTaskId, setSparkleTaskId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const sortLabel = {
    due_date: 'Due Date',
    priority: 'Priority',
    energy: 'Energy',
    created: 'Created',
    manual: 'Manual',
  }[sort];

  const activeListForDisplay = sort === 'manual' && manualOrderedActive.length > 0
    ? manualOrderedActive
    : sortedActive;

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  useEffect(() => {
    if (sort === 'manual') setManualOrderedActive([...sortedActive]);
  }, [sort, sortedActive.length]);

  const loadAll = async () => {
    const loaded = await getActiveTasks();
    const custom = await getCustomCategories();
    setTasks(loaded);
    setCustomCategories(custom);
  };

  const handleToggle = async (id: string) => {
    await toggleTask(id);
    await loadAll();
    const current = await getActiveTasks();
    const task = current.find(t => t.id === id);
    const nowCompleted = task?.completed ?? false;
    const allDone = current.length > 0 && current.every(t => t.completed);

    if (allDone) {
      setShowCelebration(true);
      setSparkleTaskId(null);
      setShowAllComplete(true);
    } else if (nowCompleted) {
      setSparkleTaskId(id);
      setShowCelebration(false);
      setShowSingleComplete(true);
    } else {
      setSparkleTaskId(null);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(id);
          loadAll();
        },
      },
    ]);
  };

  const handleSubtaskToggle = async (taskId: string, subtaskId: string) => {
    const prevTasks = await getActiveTasks();
    const task = prevTasks.find(t => t.id === taskId);
    const wasCompleted = task?.completed ?? false;
    await toggleSubtask(taskId, subtaskId);
    await loadAll();
    const current = await getActiveTasks();
    const updated = current.find(t => t.id === taskId);
    const nowCompleted = updated?.completed ?? false;
    const allDone = current.length > 0 && current.every(t => t.completed);
    if (allDone) setShowAllComplete(true);
    else if (!wasCompleted && nowCompleted) setShowSingleComplete(true);
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

  const handleManualDragEnd = useCallback(async ({ data }: { data: Task[] }) => {
    setManualOrderedActive(data);
    const all = await getTasks();
    const others = all.filter(t => !data.some(d => d.id === t.id));
    await updateSortOrder([...data, ...others]);
    loadAll();
  }, []);

  const renderRightActions = (item: Task) => () => (
    <TouchableOpacity
      style={[styles.swipeDelete, { backgroundColor: colors.danger }]}
      onPress={() => handleDelete(item.id)}
    >
      <Ionicons name="trash-outline" size={22} color="#fff" />
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderTaskContent = (item: Task) => {
    const catInfo = getCategoryInfo(item.category, customCategories);
    return (
      <>
        <View style={[styles.priorityStrip, { backgroundColor: getPriorityColor(item.priority) }]} />
        <View style={styles.taskContent}>
          <Text style={[
            styles.taskTitle,
            { color: colors.text },
            item.completed && { textDecorationLine: 'line-through', opacity: 0.5 },
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
            <View style={styles.subtaskList}>
              {(item.subtasks ?? []).map(st => (
                <TouchableOpacity
                  key={st.id}
                  style={styles.subtaskRow}
                  onPress={() => handleSubtaskToggle(item.id, st.id)}
                >
                  <View style={[styles.subtaskCheck, { borderColor: colors.border }, st.completed && { backgroundColor: colors.accent }]}>
                    {st.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={[styles.subtaskRowText, { color: colors.text }, st.completed && { textDecorationLine: 'line-through', opacity: 0.7 }]}>
                    {st.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.taskActions}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(tabs)/edittask', params: { id: item.id } })}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.subtext} />
          </TouchableOpacity>
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
      </>
    );
  };

  const renderTask = ({ item }: { item: Task }) => (
    <Swipeable
      renderRightActions={renderRightActions(item)}
      overshootRight={false}
    >
      <View style={[styles.taskCard, { backgroundColor: colors.card }]}>
        {renderTaskContent(item)}
      </View>
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Sakura background */}
      <LottieView
        source={require('@/assets/animations/cherry-blossom.json')}
        autoPlay
        loop
        style={[StyleSheet.absoluteFillObject, { opacity: 0.52 }]}
        resizeMode="cover"
        speed={0.4}
      />
      {showSingleComplete && (
        <LottieView
          source={require('@/assets/animations/confetties.json')}
          autoPlay
          loop={false}
          style={StyleSheet.absoluteFillObject}
          onAnimationFinish={() => setShowSingleComplete(false)}
        />
      )}
      {showAllComplete && (
        <LottieView
          source={require('@/assets/animations/celebrations-begin.json')}
          autoPlay
          loop={false}
          style={StyleSheet.absoluteFillObject}
          onAnimationFinish={() => setShowAllComplete(false)}
        />
      )}

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
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: colors.accent },
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
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
        {activeListForDisplay.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>Active</Text>
            {sort === 'manual' ? (
              <DraggableFlatList
                data={activeListForDisplay}
                onDragEnd={handleManualDragEnd}
                keyExtractor={(t) => t.id}
                scrollEnabled={false}
                renderItem={({ item, drag }) => (
                  <Reanimated.View entering={SlideInDown.duration(300).springify()} style={{ marginBottom: 8 }}>
                    <TouchableOpacity onLongPress={drag} delayLongPress={200}>
                      {renderTask({ item })}
                    </TouchableOpacity>
                  </Reanimated.View>
                )}
              />
            ) : (
              activeListForDisplay.map(task => (
                <Reanimated.View
                  key={task.id}
                  entering={SlideInDown.duration(300).springify()}
                  style={{ marginBottom: 8 }}
                >
                  {renderTask({ item: task })}
                </Reanimated.View>
              ))
            )}
          </>
        )}

        {/* Empty state — when no active tasks */}
        {sortedActive.length === 0 && (
          <View style={styles.emptyState}>
            <LottieView
              source={require('@/assets/animations/game-asset.json')}
              autoPlay
              loop
              style={styles.emptyAnimation}
            />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              No tasks yet. Add your first quest!
            </Text>
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
            {showCompleted && completedTasks.map(task => (
              <Reanimated.View key={task.id} entering={SlideInDown.duration(300).springify()} style={{ marginBottom: 8 }}>
                {renderTask({ item: task })}
              </Reanimated.View>
            ))}
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

      {sparkleTaskId && (
  <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]}>
    <LottieView
      source={require('@/assets/animations/confetties.json')}
      autoPlay
      loop={false}
      style={StyleSheet.absoluteFillObject}
      onAnimationFinish={() => setSparkleTaskId(null)}
    />
  </View>
)}
      {showCelebration && (
  <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]}>
    <LottieView
      source={require('@/assets/animations/celebrations-begin.json')}
      autoPlay
      loop={false}
      style={StyleSheet.absoluteFillObject}
      onAnimationFinish={() => setShowCelebration(false)}
    />
  </View>
)}

    </View>
    </GestureHandlerRootView>
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
  subtaskList: { marginTop: 6 },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  subtaskCheck: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  subtaskRowText: { fontSize: 13, flex: 1 },
  swipeDelete: { justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: 14, marginBottom: 10 },
  swipeDeleteText: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 4 },
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
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyAnimation: { width: 300, height: 300 },
  emptyText: { fontSize: 16, marginTop: 12, textAlign: 'center' },
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