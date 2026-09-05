import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';

/**
 * Android Development Backend Configuration:
 * - When testing on an Android device via USB:
 *   Run `adb reverse tcp:5000 tcp:5000` so localhost:5000 forwards directly to your PC.
 * - Alternatively, replace with your local machine's Wi-Fi IP address (e.g. 'http://192.168.1.8:5000').
 * - For Android Emulator: 'http://10.0.2.2:5000'
 */
// export const API_BASE_URL = 'http://192.168.1.8:5000';
export const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: automatically attach JWT token if present
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore token read errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Task API functions
export const getTasks = async (): Promise<Task[]> => {
  const response = await api.get<{ tasks: Task[] }>('/api/tasks');
  return response.data.tasks;
};

export const createTask = async (payload: CreateTaskInput): Promise<Task> => {
  const response = await api.post<{ message: string; task: Task }>('/api/tasks', payload);
  return response.data.task;
};

export const updateTask = async (id: string, payload: UpdateTaskInput): Promise<Task> => {
  const response = await api.put<{ message: string; task: Task }>(`/api/tasks/${id}`, payload);
  return response.data.task;
};

export const deleteTask = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/api/tasks/${id}`);
  return response.data;
};

export default api;

