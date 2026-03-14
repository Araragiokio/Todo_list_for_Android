import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { addTask } from '@/storage/TaskStorage';
import { Category, Priority } from '@/types/Task';
import { CATEGORIES } from '@/constants/Categories';
import { Ionicons } from '@expo/vector-icons';

export default function AddTaskScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Study');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCategory = CATEGORIES.find(c => c.name === category);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Oops!', 'Please enter a task name.');
      return;
    }
    setSaving(true);
    try {
      await addTask({
        name: name.trim(),
        category,
        priority,
        dueDate: dueDate || null,
        reminder: null,
      });
      // Reset form
      setName('');
      setCategory('Study');
      setPriority('medium');
      setDueDate('');
      Alert.alert('Done! 🗡️', 'Task added successfully!');
    } catch {
      Alert.alert('Error', 'Something went wrong. Try again.');
    }
    setSaving(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.header, { color: colors.text }]}>
          New Task
        </Text>

        {/* Task Name */}
        <Text style={[styles.label, { color: colors.subtext }]}>
          Task Name
        </Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border,
          }]}
          placeholder="What do you need to do?"
          placeholderTextColor={colors.subtext}
          value={name}
          onChangeText={setName}
          multiline
        />

        {/* Category */}
        <Text style={[styles.label, { color: colors.subtext }]}>
          Category
        </Text>
        <TouchableOpacity
          style={[styles.selector, {
            backgroundColor: colors.card,
            borderColor: colors.border,
          }]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={{ fontSize: 20 }}>{selectedCategory?.emoji}</Text>
          <Text style={[styles.selectorText, { color: colors.text }]}>
            {category}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.subtext} />
        </TouchableOpacity>

        {/* Priority */}
        <Text style={[styles.label, { color: colors.subtext }]}>
          Priority
        </Text>
        <View style={styles.priorityRow}>
          {(['high', 'medium', 'low'] as Priority[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.priorityBtn,
                {
                  backgroundColor: priority === p
                    ? getPriorityColor(p)
                    : colors.card,
                  borderColor: getPriorityColor(p),
                }
              ]}
              onPress={() => setPriority(p)}
            >
              <Text style={[
                styles.priorityText,
                { color: priority === p ? '#FFFFFF' : getPriorityColor(p) }
              ]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Due Date */}
        <Text style={[styles.label, { color: colors.subtext }]}>
          Due Date (optional)
        </Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border,
          }]}
          placeholder="YYYY-MM-DD (e.g. 2026-03-20)"
          placeholderTextColor={colors.subtext}
          value={dueDate}
          onChangeText={setDueDate}
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.accent }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving...' : 'Save Task ✓'}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Choose Category
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CATEGORIES}
              keyExtractor={item => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor: category === item.name
                        ? colors.accent + '20'
                        : 'transparent',
                      borderBottomColor: colors.border,
                    }
                  ]}
                  onPress={() => {
                    setCategory(item.name as Category);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                  <Text style={[styles.categoryName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  {category === item.name && (
                    <Ionicons name="checkmark" size={18} color={colors.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getPriorityColor = (priority: string) => {
  if (priority === 'high') return '#F44336';
  if (priority === 'medium') return '#FF9800';
  return '#4CAF50';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  selector: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  priorityBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
  },
});