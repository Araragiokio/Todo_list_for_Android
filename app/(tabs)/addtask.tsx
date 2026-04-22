import { DEFAULT_CATEGORIES, getCategoryInfo } from '@/constants/Categories';
import { useTheme } from '@/context/ThemeContext';
import { addTask, getCustomCategories } from '@/storage/TaskStorage';
import { EnergyLevel, Priority, RecurringType, Subtask, TaskInput } from '@/Types/Task';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const ENERGY_LEVELS: EnergyLevel[] = ['deep_work', 'quick_task', 'low_energy', 'focus'];
const RECURRING_TYPES: Exclude<RecurringType, null>[] = ['daily', 'weekly', 'monthly', 'yearly'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AddTaskScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [customCategories, setCustomCategories] = useState<any[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Work / Career');
  const [tagsInput, setTagsInput] = useState('');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null);
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [autoReminder, setAutoReminder] = useState(true);
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [recurring, setRecurring] = useState<RecurringType>(null);
  const [recurringDay, setRecurringDay] = useState<string | null>(null);

  // UI state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    loadCustomCategories();
  }, []);

  const loadCustomCategories = async () => {
    const cats = await getCustomCategories();
    setCustomCategories(cats);
  };

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const parsedTags = tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const resetForm = () => {
    setTitle('');
    setCategory('Work / Career');
    setTagsInput('');
    setEnergyLevel(null);
    setPriority('medium');
    setDueDate(null);
    setAutoReminder(true);
    setNotes('');
    setSubtasks([]);
    setRecurring(null);
    setRecurringDay(null);
    setNewSubtask('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a task title.');
      return;
    }

    setLoading(true);
    try {
      const reminder: string | null =
        autoReminder && dueDate ? dueDate : null;

      const taskInput: TaskInput = {
        title: title.trim(),
        category,
        tags: parsedTags,
        energyLevel,
        priority,
        dueDate,
        reminder,
        notes: notes.trim(),
        subtasks,
        recurring,
        recurringDay,
      };

      await addTask(taskInput);
      resetForm();
      router.back();
    } catch  {
      Alert.alert('Error', 'Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask: Subtask = {
      id: Date.now().toString(),
      title: newSubtask.trim(),
      completed: false,
    };
    setSubtasks(prev => [...prev, subtask]);
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id));
  };

  const showDatePicker = () => {
  if (Platform.OS === 'android') {
    DateTimePickerAndroid.open({
      value: dueDate ? new Date(dueDate) : new Date(),
      mode: 'date',
      onChange: (event, selectedDate) => {
        if (event.type === 'dismissed') return;
        if (selectedDate) {
          // Step 2 — immediately open time picker after date selected
          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: 'time',
            is24Hour: false,
            onChange: (timeEvent, selectedTime) => {
              if (timeEvent.type === 'dismissed') return;
              if (selectedTime) {
                // Combine date + time into one ISO string
                const combined = new Date(selectedDate);
                combined.setHours(selectedTime.getHours());
                combined.setMinutes(selectedTime.getMinutes());
                combined.setSeconds(0);
                setDueDate(combined.toISOString());
              }
            },
          });
        }
      },
    });
  } else {
    Alert.alert('Coming Soon', 'Date picker is currently supported on Android only.');
  }
};

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'high':
        return colors.danger;
      case 'medium':
        return colors.warning;
      case 'low':
      default:
        return colors.success;
    }
  };

  const getEnergyIcon = (level: EnergyLevel) => {
    switch (level) {
      case 'deep_work':
        return '🧠';
      case 'focus':
        return '🎯';
      case 'quick_task':
        return '⚡';
      case 'low_energy':
      default:
        return '💤';
    }
  };

  const recurringSummary = () => {
    if (!recurring) return 'Not repeating';
    if (recurring === 'daily') return 'Repeats daily';
    if (recurring === 'weekly') return recurringDay ? `Every ${recurringDay}` : 'Weekly';
    if (recurring === 'monthly') return recurringDay ? `Every ${recurringDay}th` : 'Monthly';
    if (recurring === 'yearly') return 'Yearly';
    return 'Not repeating';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Task</Text>
        <TouchableOpacity onPress={handleSave} style={styles.iconButton} disabled={loading}>
          <Ionicons name="checkmark" size={26} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>Task title *</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="What do you want to get done?"
          placeholderTextColor={colors.subtext}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Category */}
      <TouchableOpacity
        style={[styles.section, { backgroundColor: colors.card }]}
        onPress={() => setShowCategoryModal(true)}
      >
        <Text style={[styles.label, { color: colors.text }]}>Category</Text>
        <View style={styles.row}>
          <Text style={[styles.value, { color: colors.text }]}>
            {getCategoryInfo(category, customCategories).emoji} {category}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </View>
      </TouchableOpacity>

      {/* Tags */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>Tags</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Tags, separated by commas (e.g. coding, deepwork)"
          placeholderTextColor={colors.subtext}
          value={tagsInput}
          onChangeText={setTagsInput}
        />
        {parsedTags.length > 0 && (
          <View style={styles.tagRow}>
            {parsedTags.map(tag => (
              <View key={tag} style={[styles.tagChip, { backgroundColor: colors.accent + '20' }]}>
                <Text style={[styles.tagText, { color: colors.accent }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Priority */}
      <TouchableOpacity
        style={[styles.section, { backgroundColor: colors.card }]}
        onPress={() => setShowPriorityModal(true)}
      >
        <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
        <View style={styles.row}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(priority) }]} />
          <Text style={[styles.value, { color: colors.text, textTransform: 'capitalize' }]}>
            {priority}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </View>
      </TouchableOpacity>

      {/* Energy level */}
      <TouchableOpacity
        style={[styles.section, { backgroundColor: colors.card }]}
        onPress={() => setShowEnergyModal(true)}
      >
        <Text style={[styles.label, { color: colors.text }]}>Energy level</Text>
        <View style={styles.row}>
          <Text style={[styles.value, { color: colors.text }]}>
            {energyLevel
              ? `${getEnergyIcon(energyLevel)} ${energyLevel.replace('_', ' ')}`
              : 'Not set'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </View>
      </TouchableOpacity>

      {/* Due date + auto reminder */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>Due date & reminder</Text>
        <TouchableOpacity style={styles.row} onPress={showDatePicker}>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={20} color={colors.subtext} />
            <Text style={[styles.value, { marginLeft: 8, color: colors.text }]}>
              {formatDate(dueDate)}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={[styles.row, { marginTop: 12, justifyContent: 'space-between' }]}>
          <View>
            <Text style={[styles.smallLabel, { color: colors.text }]}>Auto reminder</Text>
            <Text style={[styles.helperText, { color: colors.subtext }]}>
              When a due date is set, schedule a reminder.
            </Text>
          </View>
          <Switch
            value={autoReminder}
            onValueChange={setAutoReminder}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={autoReminder ? colors.accent : colors.subtext}
          />
        </View>
      </View>

      {/* Notes */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
        <TextInput
          style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
          placeholder="Extra details, links, or context..."
          placeholderTextColor={colors.subtext}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Subtasks */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>Subtasks</Text>
        {subtasks.map(st => (
          <View key={st.id} style={styles.subtaskRow}>
            <Text style={[styles.subtaskText, { color: colors.text }]} numberOfLines={2}>
              {st.title}
            </Text>
            <TouchableOpacity onPress={() => removeSubtask(st.id)}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.addSubtaskRow}>
          <TextInput
            style={[styles.subtaskInput, { borderColor: colors.border, color: colors.text }]}
            placeholder="Add a checklist item"
            placeholderTextColor={colors.subtext}
            value={newSubtask}
            onChangeText={setNewSubtask}
            onSubmitEditing={addSubtask}
          />
          <TouchableOpacity onPress={addSubtask}>
            <Ionicons name="add-circle" size={28} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recurring */}
      <TouchableOpacity
        style={[styles.section, { backgroundColor: colors.card, marginBottom: 32 }]}
        onPress={() => setShowRecurringModal(true)}
      >
        <Text style={[styles.label, { color: colors.text }]}>Repeat</Text>
        <View style={styles.row}>
          <Text style={[styles.value, { color: colors.text }]}>{recurringSummary()}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </View>
      </TouchableOpacity>

      {/* Category modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select category</Text>
            <ScrollView style={{ maxHeight: '70%' }}>
              {allCategories.map(cat => (
                <TouchableOpacity
                  key={cat.name}
                  style={styles.modalOption}
                  onPress={() => {
                    setCategory(cat.name);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>
                    {cat.emoji} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.accent }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Priority modal */}
      <Modal visible={showPriorityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select priority</Text>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p}
                style={styles.modalOption}
                onPress={() => {
                  setPriority(p);
                  setShowPriorityModal(false);
                }}
              >
                <View style={styles.row}>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(p) }]} />
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: colors.text, textTransform: 'capitalize' },
                    ]}
                  >
                    {p}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowPriorityModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.accent }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Energy modal */}
      <Modal visible={showEnergyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select energy level</Text>
            {ENERGY_LEVELS.map(level => (
              <TouchableOpacity
                key={level}
                style={styles.modalOption}
                onPress={() => {
                  setEnergyLevel(level);
                  setShowEnergyModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: colors.text }]}>
                  {getEnergyIcon(level)} {level.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setEnergyLevel(null);
                setShowEnergyModal(false);
              }}
            >
              <Text style={[styles.modalOptionText, { color: colors.text }]}>None</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowEnergyModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.accent }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Recurring modal */}
      <Modal visible={showRecurringModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Repeat</Text>
            {RECURRING_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={styles.modalOption}
                onPress={() => {
                  setRecurring(type);
                  if (type === 'weekly') {
                    setRecurringDay(WEEKDAYS[new Date().getDay()]);
                  } else if (type === 'monthly') {
                    setRecurringDay(String(new Date().getDate()));
                  } else {
                    setRecurringDay(null);
                  }
                  setShowRecurringModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: colors.text, textTransform: 'capitalize' }]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setRecurring(null);
                setRecurringDay(null);
                setShowRecurringModal(false);
              }}
            >
              <Text style={[styles.modalOptionText, { color: colors.text }]}>Do not repeat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowRecurringModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.accent }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 15,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  subtaskText: {
    flex: 1,
    fontSize: 14,
    marginRight: 10,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  subtaskInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 10,
  },
  modalOptionText: {
    fontSize: 15,
  },
  modalClose: {
    marginTop: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
  },
});