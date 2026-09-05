import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import type { AppStackParamList } from '../types/navigation';
import type { TaskPriority } from '../types';
import { createTask } from '../services/api';

type AddTaskScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'AddTask'
>;

type Props = {
  navigation: AddTaskScreenNavigationProp;
};

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function parseDateTime(dateStr: string, timeStr: string): Date | null {
  const dateParts = dateStr.trim().split('-');
  const timeParts = timeStr.trim().split(':');

  if (dateParts.length !== 3 || timeParts.length !== 2) {
    return null;
  }

  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const day = parseInt(dateParts[2], 10);
  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);

  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    isNaN(hour) ||
    isNaN(minute) ||
    month < 0 ||
    month > 11 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const d = new Date(year, month, day, hour, minute, 0, 0);
  if (isNaN(d.getTime())) {
    return null;
  }

  return d;
}

export default function AddTaskScreen({ navigation }: Props) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(formatDate(now));
  const [scheduledTime, setScheduledTime] = useState(formatTime(now));
  const [deadlineDate, setDeadlineDate] = useState(formatDate(tomorrow));
  const [deadlineTime, setDeadlineTime] = useState('18:00');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    scheduled?: string;
    deadline?: string;
    general?: string;
  }>({});

  // Preset helpers for Scheduled Date & Time
  const applyScheduledPreset = (preset: 'now' | 'plus1Hour' | 'tomorrowMorning') => {
    const d = new Date();
    if (preset === 'plus1Hour') {
      d.setHours(d.getHours() + 1);
    } else if (preset === 'tomorrowMorning') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    }
    setScheduledDate(formatDate(d));
    setScheduledTime(formatTime(d));
    setErrors((prev) => ({ ...prev, scheduled: undefined }));
  };

  // Preset helpers for Deadline
  const applyDeadlinePreset = (preset: 'plus2Hours' | 'tomorrowEvening' | 'plus3Days' | 'plus1Week') => {
    const base = parseDateTime(scheduledDate, scheduledTime) ?? new Date();
    const d = new Date(base.getTime());

    if (preset === 'plus2Hours') {
      d.setHours(d.getHours() + 2);
    } else if (preset === 'tomorrowEvening') {
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
    } else if (preset === 'plus3Days') {
      d.setDate(d.getDate() + 3);
      d.setHours(18, 0, 0, 0);
    } else if (preset === 'plus1Week') {
      d.setDate(d.getDate() + 7);
      d.setHours(18, 0, 0, 0);
    }

    setDeadlineDate(formatDate(d));
    setDeadlineTime(formatTime(d));
    setErrors((prev) => ({ ...prev, deadline: undefined }));
  };

  const validate = (): {
    isValid: boolean;
    parsedScheduled: Date | null;
    parsedDeadline: Date | null;
  } => {
    const newErrors: {
      title?: string;
      scheduled?: string;
      deadline?: string;
      general?: string;
    } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    const parsedScheduled = parseDateTime(scheduledDate, scheduledTime);
    if (!parsedScheduled) {
      newErrors.scheduled = 'Valid date (YYYY-MM-DD) and time (HH:mm) are required';
    }

    const parsedDeadline = parseDateTime(deadlineDate, deadlineTime);
    if (!parsedDeadline) {
      newErrors.deadline = 'Valid deadline date (YYYY-MM-DD) and time (HH:mm) are required';
    }

    if (parsedScheduled && parsedDeadline) {
      if (parsedDeadline.getTime() < parsedScheduled.getTime()) {
        newErrors.deadline = 'Deadline cannot be earlier than the scheduled date & time';
      }
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      parsedScheduled,
      parsedDeadline,
    };
  };

  const handleSaveTask = async () => {
    const { isValid, parsedScheduled, parsedDeadline } = validate();
    if (!isValid || !parsedScheduled || !parsedDeadline) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      await createTask({
        title: title.trim(),
        description: description.trim(),
        dateTime: parsedScheduled.toISOString(),
        deadline: parsedDeadline.toISOString(),
        priority,
      });

      navigation.goBack();
    } catch (error: unknown) {
      let message = 'Failed to create task. Please try again.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Task</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {errors.general ? (
            <View style={styles.generalErrorBanner}>
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* Title Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Title <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="e.g. Complete math assignment"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              editable={!loading}
            />
            {errors.title ? (
              <Text style={styles.errorText}>{errors.title}</Text>
            ) : null}
          </View>

          {/* Description Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add details or notes about this task"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          {/* Priority Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Priority <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high'] as TaskPriority[]).map((level) => {
                const isSelected = priority === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.priorityOption,
                      isSelected && styles[`priorityOption_${level}`],
                    ]}
                    onPress={() => setPriority(level)}
                    activeOpacity={0.8}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.priorityOptionText,
                        isSelected && styles[`priorityText_${level}`],
                      ]}
                    >
                      {level.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Scheduled Date & Time */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Scheduled Date & Time <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateCol}>
                <Text style={styles.subLabel}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.input, errors.scheduled && styles.inputError]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={scheduledDate}
                  onChangeText={(text) => {
                    setScheduledDate(text);
                    if (errors.scheduled) {
                      setErrors((prev) => ({ ...prev, scheduled: undefined }));
                    }
                  }}
                  editable={!loading}
                />
              </View>
              <View style={styles.timeCol}>
                <Text style={styles.subLabel}>Time (HH:mm)</Text>
                <TextInput
                  style={[styles.input, errors.scheduled && styles.inputError]}
                  placeholder="HH:mm"
                  placeholderTextColor="#9CA3AF"
                  value={scheduledTime}
                  onChangeText={(text) => {
                    setScheduledTime(text);
                    if (errors.scheduled) {
                      setErrors((prev) => ({ ...prev, scheduled: undefined }));
                    }
                  }}
                  editable={!loading}
                />
              </View>
            </View>
            {errors.scheduled ? (
              <Text style={styles.errorText}>{errors.scheduled}</Text>
            ) : null}

            {/* Quick Presets for Scheduled */}
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyScheduledPreset('now')}
                disabled={loading}
              >
                <Text style={styles.presetChipText}>Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyScheduledPreset('plus1Hour')}
                disabled={loading}
              >
                <Text style={styles.presetChipText}>+1 Hour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyScheduledPreset('tomorrowMorning')}
                disabled={loading}
              >
                <Text style={styles.presetChipText}>Tomorrow 9 AM</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Deadline Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Deadline <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateCol}>
                <Text style={styles.subLabel}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.input, errors.deadline && styles.inputError]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={deadlineDate}
                  onChangeText={(text) => {
                    setDeadlineDate(text);
                    if (errors.deadline) {
                      setErrors((prev) => ({ ...prev, deadline: undefined }));
                    }
                  }}
                  editable={!loading}
                />
              </View>
              <View style={styles.timeCol}>
                <Text style={styles.subLabel}>Time (HH:mm)</Text>
                <TextInput
                  style={[styles.input, errors.deadline && styles.inputError]}
                  placeholder="HH:mm"
                  placeholderTextColor="#9CA3AF"
                  value={deadlineTime}
                  onChangeText={(text) => {
                    setDeadlineTime(text);
                    if (errors.deadline) {
                      setErrors((prev) => ({ ...prev, deadline: undefined }));
                    }
                  }}
                  editable={!loading}
                />
              </View>
            </View>
            {errors.deadline ? (
              <Text style={styles.errorText}>{errors.deadline}</Text>
            ) : null}

            {/* Quick Presets for Deadline */}
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyDeadlinePreset('plus2Hours')}
                disabled={loading}
              >
                <Text style={styles.presetChipText}>+2 Hours</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyDeadlinePreset('tomorrowEvening')}
                disabled={loading}
              >
                <Text style={styles.presetChipText}>Tomorrow 6 PM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyDeadlinePreset('plus3Days')}
                disabled={loading}
              >
                <Text style={styles.presetChipText}>+3 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyDeadlinePreset('plus1Week')}
                disabled={loading}
              >
                <Text style={styles.presetChipText}>+1 Week</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSaveTask}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Save Task</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoid: {
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
  cancelButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  cancelText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 50,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  generalErrorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  requiredStar: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    minHeight: 90,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  priorityOption_low: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  priorityText_low: {
    color: '#059669',
  },
  priorityOption_medium: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  priorityText_medium: {
    color: '#D97706',
  },
  priorityOption_high: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  priorityText_high: {
    color: '#DC2626',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: {
    flex: 3,
  },
  timeCol: {
    flex: 2,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  presetChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  presetChipText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
