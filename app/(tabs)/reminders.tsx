import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, RefreshControl, Platform
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { editTask, getTasks, toggleTask } from '../../storage/TaskStorage';
import { Task } from '../../Types/Task';

// ─── Helpers ────────────────────────────────────────────────────────────────

const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const isFuture = (dateStr: string) => new Date(dateStr) > new Date();
const isPast = (dateStr: string) => new Date(dateStr) < new Date();

const relativeTime = (dateStr: string): string => {
  const diff = new Date(dateStr).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(abs / 3600000);

  if (diff < 0) {
    if (mins < 60) return `${mins}m overdue`;
    return `${hours}h overdue`;
  }
  if (mins < 60) return `in ${mins}m`;
  if (hours < 24) return `in ${hours}h`;
  return new Date(dateStr).toLocaleDateString();
};

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ─── Sub-components ─────────────────────────────────────────────────────────

type ReminderCardProps = {
  task: Task;
  type: 'due' | 'upcoming' | 'overdue';
  colors: any;
  onSnooze: (task: Task) => void;
  onDone: (task: Task) => void;
  onReschedule: (task: Task) => void;
};

const ReminderCard = ({ task, type, colors, onSnooze, onDone, onReschedule }: ReminderCardProps) => {
  const isOverdue = type === 'overdue';
  const borderColor = isOverdue ? '#FF4444' : type === 'due' ? colors.accent : colors.border;

  return (
    <View style={[styles.card, {
      backgroundColor: colors.card,
      borderLeftColor: borderColor,
      borderLeftWidth: 4,
    }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={styles.cardMeta}>
            <Ionicons
              name={isOverdue ? 'warning' : 'time-outline'}
              size={12}
              color={isOverdue ? '#FF4444' : colors.subtext}
            />
            <Text style={[styles.timeText, { color: isOverdue ? '#FF4444' : colors.subtext }]}>
              {task.dueDate ? `${formatTime(task.dueDate)} · ${relativeTime(task.dueDate)}` : 'No time set'}
            </Text>
            <View style={[styles.typeBadge, {
              backgroundColor: isOverdue ? '#FF444422' : colors.accent + '22'
            }]}>
              <Text style={[styles.typeText, {
                color: isOverdue ? '#FF4444' : colors.accent
              }]}>
                {type === 'due' ? 'Due Today' : type === 'overdue' ? 'Overdue' : 'Upcoming'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={() => onSnooze(task)}
        >
          <Ionicons name="alarm-outline" size={14} color={colors.subtext} />
          <Text style={[styles.actionText, { color: colors.subtext }]}>Snooze</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={() => onReschedule(task)}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.subtext} />
          <Text style={[styles.actionText, { color: colors.subtext }]}>Reschedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
          onPress={() => onDone(task)}
        >
          <Ionicons name="checkmark" size={14} color="#fff" />
          <Text style={[styles.actionText, { color: '#fff' }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Section Header ──────────────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle, icon, colors }: any) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon} size={16} color={colors.accent} />
    <View style={{ marginLeft: 8 }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.sectionSubtitle, { color: colors.subtext }]}>{subtitle}</Text>
      )}
    </View>
  </View>
);

// ─── Empty State ─────────────────────────────────────────────────────────────

const EmptySection = ({ message, colors }: { message: string; colors: any }) => (
  <View style={[styles.emptySection, { borderColor: colors.border }]}>
    <Text style={[styles.emptyText, { color: colors.subtext }]}>{message}</Text>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function RemindersScreen() {
  const { colors } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = async () => {
    const all = await getTasks();
    setTasks(all.filter(t => !t.completed && t.dueDate));
  };

  useFocusEffect(useCallback(() => { loadTasks(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  // Categorise tasks
 const overdueTasks = tasks.filter(t => t.dueDate && isPast(t.dueDate));
const todayTasks = tasks.filter(t => t.dueDate && isToday(t.dueDate) && isFuture(t.dueDate));
const upcomingTasks = tasks.filter(t => t.dueDate && isFuture(t.dueDate) && !isToday(t.dueDate));

  const handleSnooze = (task: Task) => {
  Alert.alert('Snooze', 'Snooze this reminder for how long?', [
    { text: '10 minutes', onPress: () => snoozeTask(task, 10) },
    { text: '30 minutes', onPress: () => snoozeTask(task, 30) },
    { text: '1 hour',     onPress: () => snoozeTask(task, 60) },
    { text: 'Cancel', style: 'cancel' },
  ]);
};

const snoozeTask = async (task: Task, minutes: number) => {
  const base = task.dueDate ? new Date(task.dueDate) : new Date();
  const newDate = new Date(base.getTime() + minutes * 60000);
  await editTask(task.id, {
    title: task.title, category: task.category, tags: task.tags,
    energyLevel: task.energyLevel, priority: task.priority,
    dueDate: newDate.toISOString(), reminder: newDate.toISOString(),
    notes: task.notes, subtasks: task.subtasks,
    recurring: task.recurring, recurringDay: task.recurringDay,
  });
  await loadTasks();
};

  
  const handleDone = (task: Task) => {
    Alert.alert('Mark as Done', `Complete "${task.title}"?`, [
      { text: 'Yes', onPress: async () => {
        await toggleTask(task.id);
        await loadTasks();
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleReschedule = (task: Task) => {
  if (Platform.OS !== 'android') {
    Alert.alert('Coming Soon', 'Date picker is currently supported on Android only.');
    return;
  }

  // Step 1 — pick date
  DateTimePickerAndroid.open({
    value: task.dueDate ? new Date(task.dueDate) : new Date(),
    mode: 'date',
    onChange: (event, selectedDate) => {
      if (event.type === 'dismissed' || !selectedDate) return;

      // Step 2 — pick time for that date
      DateTimePickerAndroid.open({
        value: task.dueDate ? new Date(task.dueDate) : new Date(),
        mode: 'time',
        is24Hour: false,
        onChange: async (timeEvent, selectedTime) => {
          if (timeEvent.type === 'dismissed' || !selectedTime) return;

          const finalDate = new Date(selectedDate);
          finalDate.setHours(selectedTime.getHours());
          finalDate.setMinutes(selectedTime.getMinutes());
          finalDate.setSeconds(0);

          await editTask(task.id, {
            title: task.title, category: task.category, tags: task.tags,
            energyLevel: task.energyLevel, priority: task.priority,
            dueDate: finalDate.toISOString(), reminder: finalDate.toISOString(),
            notes: task.notes, subtasks: task.subtasks,
            recurring: task.recurring, recurringDay: task.recurringDay,
          });
          await loadTasks();
        },
      });
    },
  });
};

  const handleSnoozeAll = () => {
  Alert.alert('Snooze All', 'Snooze all reminders for 30 minutes?', [
    { text: 'Yes', onPress: async () => {
      await Promise.all(tasks.map(t => snoozeTask(t, 30)));
    }},
    { text: 'Cancel', style: 'cancel' },
  ]);
};

const handleClearAll = () => {
  Alert.alert('Clear All', 'This will mark all reminders as done. Continue?', [
    { text: 'Yes, Clear', style: 'destructive', onPress: async () => {
      await Promise.all(tasks.map(t => toggleTask(t.id)));
      await loadTasks();
    }},
    { text: 'Cancel', style: 'cancel' },
  ]);
};

  const totalCount = todayTasks.length + overdueTasks.length + upcomingTasks.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mission Control</Text>
          <Text style={[styles.headerSub, { color: colors.subtext }]}>
            {totalCount === 0 ? 'All clear, warrior 🎌' : `${totalCount} mission${totalCount > 1 ? 's' : ''} need attention`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleBtn, {
            backgroundColor: remindersEnabled ? colors.accent : colors.border
          }]}
          onPress={() => setRemindersEnabled(p => !p)}
        >
          <Ionicons name={remindersEnabled ? 'notifications' : 'notifications-off'} size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Quick Controls ── */}
      <View style={[styles.quickControls, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.quickBtn} onPress={handleSnoozeAll}>
          <Ionicons name="alarm-outline" size={14} color={colors.accent} />
          <Text style={[styles.quickBtnText, { color: colors.accent }]}>Snooze All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={handleClearAll}>
          <Ionicons name="trash-outline" size={14} color={colors.subtext} />
          <Text style={[styles.quickBtnText, { color: colors.subtext }]}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >

        {/* ── Overdue ── */}
        <SectionHeader
          title="Overdue"
          subtitle="These missions have been waiting"
          icon="warning-outline"
          colors={colors}
        />
        {overdueTasks.length === 0
          ? <EmptySection message="No overdue tasks 🎉" colors={colors} />
          : overdueTasks.map(t => (
            <ReminderCard key={t.id} task={t} type="overdue"
              colors={colors} onSnooze={handleSnooze}
              onDone={handleDone} onReschedule={handleReschedule}
            />
          ))
        }

        {/* ── Today ── */}
        <SectionHeader
          title="Today's Timeline"
          subtitle="Your missions for today"
          icon="today-outline"
          colors={colors}
        />
        {todayTasks.length === 0
          ? <EmptySection message="Nothing scheduled for today" colors={colors} />
          : todayTasks
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
            .map(t => (
              <ReminderCard key={t.id} task={t} type="due"
                colors={colors} onSnooze={handleSnooze}
                onDone={handleDone} onReschedule={handleReschedule}
              />
            ))
        }

        {/* ── Upcoming ── */}
        <SectionHeader
          title="Upcoming"
          subtitle="Future missions on the horizon"
          icon="calendar-outline"
          colors={colors}
        />
        {upcomingTasks.length === 0
          ? <EmptySection message="No upcoming reminders" colors={colors} />
          : upcomingTasks
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
            .map(t => (
              <ReminderCard key={t.id} task={t} type="upcoming"
                colors={colors} onSnooze={handleSnooze}
                onDone={handleDone} onReschedule={handleReschedule}
              />
            ))
        }

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: 'row', justifyContent: 'space-between',
                    alignItems: 'center', padding: 20, paddingTop: 60,
                    borderBottomWidth: 1 },
  headerTitle:    { fontSize: 24, fontWeight: '700' },
  headerSub:      { fontSize: 13, marginTop: 2 },
  toggleBtn:      { width: 40, height: 40, borderRadius: 20,
                    alignItems: 'center', justifyContent: 'center' },
  quickControls:  { flexDirection: 'row', paddingHorizontal: 20,
                    paddingVertical: 10, gap: 16, borderBottomWidth: 1 },
  quickBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quickBtnText:   { fontSize: 13, fontWeight: '500' },
  scroll:         { padding: 16 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center',
                    marginTop: 24, marginBottom: 12 },
  sectionTitle:   { fontSize: 16, fontWeight: '700' },
  sectionSubtitle:{ fontSize: 12, marginTop: 1 },
  card:           { borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader:     { flexDirection: 'row', marginBottom: 12 },
  taskTitle:      { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cardMeta:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText:       { fontSize: 12 },
  typeBadge:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeText:       { fontSize: 11, fontWeight: '600' },
  cardActions:    { flexDirection: 'row', gap: 8 },
  actionBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center',
                    justifyContent: 'center', gap: 4, paddingVertical: 8,
                    borderRadius: 8, borderWidth: 1 },
  actionText:     { fontSize: 12, fontWeight: '600' },
  emptySection:   { padding: 16, borderRadius: 10, borderWidth: 1,
                    borderStyle: 'dashed', alignItems: 'center', marginBottom: 8 },
  emptyText:      { fontSize: 13 },
});
