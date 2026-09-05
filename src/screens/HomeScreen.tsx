import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getTasks } from '../services/api';
import type { Task, TaskPriority } from '../types';

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

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

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

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const renderTaskItem = ({ item }: { item: Task }) => {
    const priorityInfo = getPriorityBadgeStyle(item.priority);
    const hasDescription = Boolean(item.description && item.description.trim());

    return (
      <View style={styles.taskCard}>
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

        <Text style={styles.taskTitle}>{item.title}</Text>

        {hasDescription && (
          <Text style={styles.taskDescription}>{item.description}</Text>
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
      </View>
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
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTaskItem}
          contentContainerStyle={[
            styles.listContent,
            tasks.length === 0 && styles.emptyListContent,
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
              <Text style={styles.emptyTitle}>No Tasks Found</Text>
              <Text style={styles.emptySubtitle}>
                You do not have any tasks right now. Pull down to refresh.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
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
    paddingBottom: 32,
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
  taskDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
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
});
