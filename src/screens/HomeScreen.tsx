import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getTasks, updateTask, deleteTask } from '../services/api';
import type { Task, TaskPriority } from '../types';
import type { AppStackParamList } from '../types/navigation';

export type FilterType = 'all' | 'pending' | 'completed';
export type SortType = 'smart' | 'deadline' | 'priority' | 'newest';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'Home'
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function safeTimestamp(dateStr?: string, fallback = 0): number {
  if (!dateStr) {
    return fallback;
  }
  const t = new Date(dateStr).getTime();
  return isNaN(t) ? fallback : t;
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) {
    return '';
  }
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getPriorityBadgeStyle(priority: TaskPriority) {
  switch (priority) {
    case 'high':
      return {
        bg: '#FEE2E2',
        text: '#DC2626',
        label: 'HIGH',
      };
    case 'medium':
      return {
        bg: '#FEF3C7',
        text: '#D97706',
        label: 'MEDIUM',
      };
    case 'low':
      return {
        bg: '#E0E7FF',
        text: '#4338CA',
        label: 'LOW',
      };
    default:
      return {
        bg: '#F3F4F6',
        text: '#4B5563',
        label: 'MEDIUM',
      };
  }
}

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter and Sort states
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('smart');

  // Safeguard ref to ensure delete/edit presses never trigger toggle completion
  const isActionRef = useRef(false);

  const loadTasks = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage('');

    try {
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
    } catch (error: unknown) {
      let message = 'Unable to load tasks. Please check your network connection.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Automatically refresh tasks whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  // Filter counts
  const counts = useMemo(() => {
    let pending = 0;
    let completed = 0;
    for (const t of tasks) {
      if (t.completed) {
        completed++;
      } else {
        pending++;
      }
    }
    return { all: tasks.length, pending, completed };
  }, [tasks]);

  // Processed tasks (filtering and sorting without mutating state)
  const processedTasks = useMemo(() => {
    // 1. Filter
    const filtered = tasks.filter((t) => {
      if (filter === 'pending') {
        return !t.completed;
      }
      if (filter === 'completed') {
        return t.completed;
      }
      return true;
    });

    // 2. Sort (create a shallow copy to prevent mutation)
    return [...filtered].sort((a, b) => {
      // Pending tasks always appear before completed tasks
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      const aDeadline = safeTimestamp(a.deadline, Infinity);
      const bDeadline = safeTimestamp(b.deadline, Infinity);
      const aPriority = PRIORITY_WEIGHT[a.priority] ?? 2;
      const bPriority = PRIORITY_WEIGHT[b.priority] ?? 2;
      const aCreated = safeTimestamp(a.createdAt, 0);
      const bCreated = safeTimestamp(b.createdAt, 0);

      if (sort === 'smart') {
        // If completed, sort newest first
        if (a.completed && b.completed) {
          return bCreated - aCreated;
        }

        // Check if deadlines are reasonably close (within 24 hours)
        const diffMs = Math.abs(aDeadline - bDeadline);
        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

        if (diffMs <= TWENTY_FOUR_HOURS_MS && aPriority !== bPriority) {
          // Higher priority takes precedence
          return bPriority - aPriority;
        }

        // Earlier deadline takes precedence
        if (aDeadline !== bDeadline) {
          return aDeadline - bDeadline;
        }

        // If deadlines identical, higher priority takes precedence
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }

        // Tie-breaker: newest creation time
        return bCreated - aCreated;
      }

      if (sort === 'deadline') {
        if (aDeadline !== bDeadline) {
          return aDeadline - bDeadline;
        }
        return bPriority - aPriority;
      }

      if (sort === 'priority') {
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        return aDeadline - bDeadline;
      }

      if (sort === 'newest') {
        return bCreated - aCreated;
      }

      return 0;
    });
  }, [tasks, filter, sort]);

  const handleToggleComplete = async (task: Task) => {
    if (isActionRef.current) {
      return;
    }

    const nextCompleted = !task.completed;
    try {
      setActionLoadingId(task._id);
      const updated = await updateTask(task._id, { completed: nextCompleted });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? updated : t))
      );
    } catch (error: unknown) {
      let message = 'Failed to update task status. Please try again.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }
      Alert.alert('Error', message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteTask = (task: Task) => {
    isActionRef.current = true;
    setTimeout(() => {
      isActionRef.current = false;
    }, 500);

    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(task._id);
              await deleteTask(task._id);
              setTasks((prev) => prev.filter((t) => t._id !== task._id));
            } catch (error: unknown) {
              let message = 'Failed to delete task. Please try again.';
              if (axios.isAxiosError(error) && error.response?.data?.message) {
                message = error.response.data.message;
              }
              Alert.alert('Error', message);
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditTask = (task: Task) => {
    isActionRef.current = true;
    setTimeout(() => {
      isActionRef.current = false;
    }, 500);

    navigation.navigate('EditTask', { task });
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const priorityInfo = getPriorityBadgeStyle(item.priority);
    const hasDescription = Boolean(item.description && item.description.trim());
    const isActionLoading = actionLoadingId === item._id;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.taskCard,
          item.completed && styles.taskCardCompleted,
          pressed && !isActionLoading && styles.taskCardPressed,
        ]}
        onPress={() => handleToggleComplete(item)}
        disabled={isActionLoading}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.statusBadge,
              item.completed ? styles.statusCompleted : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.completed
                  ? styles.statusCompletedText
                  : styles.statusPendingText,
              ]}
            >
              {item.completed ? 'Completed' : 'Pending'}
            </Text>
          </View>

          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityInfo.bg },
            ]}
          >
            <Text
              style={[
                styles.priorityBadgeText,
                { color: priorityInfo.text },
              ]}
            >
              {priorityInfo.label}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.taskTitle,
            item.completed && styles.taskTitleCompleted,
          ]}
        >
          {item.title}
        </Text>

        {hasDescription && (
          <Text
            style={[
              styles.taskDescription,
              item.completed && styles.taskDescriptionCompleted,
            ]}
          >
            {item.description}
          </Text>
        )}

        <View style={styles.dateContainer}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Scheduled: </Text>
            <Text style={styles.dateValue}>{formatDateTime(item.dateTime)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Deadline: </Text>
            <Text style={styles.dateValue}>{formatDateTime(item.deadline)}</Text>
          </View>
        </View>

        {/* Card Footer with Tap Hint and Actions (Edit, Delete) */}
        <View style={styles.cardFooter}>
          <Text style={styles.tapHintText}>
            {item.completed ? 'Tap card to mark pending' : 'Tap card to complete'}
          </Text>
          <View style={styles.cardActionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.editButtonPressed,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleEditTask(item);
              }}
              disabled={isActionLoading}
              hitSlop={8}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteTask(item);
              }}
              disabled={isActionLoading}
              hitSlop={8}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>
            Hello, {user?.name ? user.name : 'User'}
          </Text>
          {user?.email ? (
            <Text style={styles.headerEmail}>{user.email}</Text>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addTaskHeaderButton}
            onPress={() => navigation.navigate('AddTask')}
            activeOpacity={0.8}
          >
            <Text style={styles.addTaskHeaderText}>+ Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centeredContainer}>
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Failed to Load Tasks</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadTasks()}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          {/* Filtering and Sorting Controls Bar */}
          {tasks.length > 0 && (
            <View style={styles.controlsContainer}>
              {/* Filter Chips */}
              <View style={styles.filterRow}>
                {(['all', 'pending', 'completed'] as FilterType[]).map((f) => {
                  const isSelected = filter === f;
                  const count = counts[f];
                  const label = f.charAt(0).toUpperCase() + f.slice(1);
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.filterChip,
                        isSelected && styles.filterChipActive,
                      ]}
                      onPress={() => setFilter(f)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextActive,
                        ]}
                      >
                        {label} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Sort Chips */}
              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Sort:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sortScrollContent}
                >
                  {(['smart', 'deadline', 'priority', 'newest'] as SortType[]).map(
                    (s) => {
                      const isSelected = sort === s;
                      const label = s.charAt(0).toUpperCase() + s.slice(1);
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.sortChip,
                            isSelected && styles.sortChipActive,
                          ]}
                          onPress={() => setSort(s)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.sortChipText,
                              isSelected && styles.sortChipTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </ScrollView>
              </View>
            </View>
          )}

          <FlatList
            data={processedTasks}
            keyExtractor={(item) => item._id}
            renderItem={renderTaskItem}
            contentContainerStyle={[
              styles.listContent,
              processedTasks.length === 0 && styles.emptyListContent,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadTasks(true)}
                colors={['#4F46E5']}
                tintColor="#4F46E5"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                  {tasks.length === 0 ? 'No Tasks Found' : 'No Matching Tasks'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {tasks.length === 0
                    ? 'You do not have any tasks right now. Pull down to refresh or create your first task.'
                    : `No ${filter} tasks found. Try changing your filter or add a new task.`}
                </Text>
                {tasks.length === 0 ? (
                  <TouchableOpacity
                    style={styles.emptyAddButton}
                    onPress={() => navigation.navigate('AddTask')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emptyAddButtonText}>+ Create Task</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            }
          />

          {/* Floating Action Button */}
          {tasks.length > 0 && (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => navigation.navigate('AddTask')}
              activeOpacity={0.85}
            >
              <Text style={styles.fabText}>+ Add Task</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerInfo: {
    flex: 1,
    marginRight: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  addTaskHeaderButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  addTaskHeaderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  controlsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  sortScrollContent: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  sortChip: {
    paddingVertical: 4,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  sortChipTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  errorBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyAddButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCardPressed: {
    backgroundColor: '#F3F4F6',
  },
  taskCardCompleted: {
    backgroundColor: '#F9FAFB',
    opacity: 0.75,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusCompletedText: {
    color: '#16A34A',
  },
  statusPendingText: {
    color: '#6B7280',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  taskDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskDescriptionCompleted: {
    color: '#9CA3AF',
  },
  dateContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dateValue: {
    fontSize: 12,
    color: '#374151',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tapHintText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    flex: 1,
    marginRight: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonPressed: {
    backgroundColor: '#E0E7FF',
  },
  editButtonText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonPressed: {
    backgroundColor: '#FCA5A5',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
