import { useTheme } from '@/context/ThemeContext';
import { getTasks } from '@/storage/TaskStorage';
import { Task } from '@/Types/Task';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    completionRate: 0,
  });

  const loadTasks = useCallback(async () => {
    const allTasks = await getTasks();
    setTasks(allTasks);

    const completed = allTasks.filter(t => t.completed).length;
    const total = allTasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    setStats({
      total,
      completed,
      pending: total - completed,
      completionRate,
    });
  }, []);

  useFocusEffect(
  React.useCallback(() => {
    const fetchData = async () => {
      await loadTasks();
    };

    fetchData();
  }, [loadTasks])
);

  const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={[styles.statLabel, { color: colors.subtext }]}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>Track your productivity</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="checkmark-circle"
            label="Completed"
            value={stats.completed}
            color={colors.success}
          />
          <StatCard
            icon="list"
            label="Pending"
            value={stats.pending}
            color={colors.warning}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="layers"
            label="Total Tasks"
            value={stats.total}
            color={colors.accent}
          />
          <StatCard
            icon="trending-up"
            label="Completion Rate"
            value={`${stats.completionRate}%`}
            color={stats.completionRate >= 75 ? colors.success : colors.warning}
          />
        </View>

        {/* Insights Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Insights</Text>
          {stats.total === 0 ? (
            <Text style={[styles.insightText, { color: colors.subtext }]}>
              Start creating tasks to see your analytics 📊
            </Text>
          ) : (
            <>
              <View style={styles.insightRow}>
                <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                <Text style={[styles.insightText, { color: colors.text, marginLeft: 10 }]}>
                  {stats.completionRate >= 75
                    ? '🔥 Great job! You\'re crushing it!'
                    : stats.completionRate >= 50
                    ? '📈 Keep pushing! You\'re halfway there.'
                    : '💪 Get started and build momentum!'}
                </Text>
              </View>
              {stats.pending > 0 && (
                <View style={styles.insightRow}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
                  <Text style={[styles.insightText, { color: colors.text, marginLeft: 10 }]}>
                    You have {stats.pending} pending task{stats.pending > 1 ? 's' : ''} waiting for attention
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
