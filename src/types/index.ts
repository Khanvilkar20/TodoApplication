import type { AuthStackParamList, AppStackParamList } from './navigation';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description: string;
  dateTime: string;
  deadline: string;
  priority: TaskPriority;
  completed: boolean;
  createdAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dateTime: string;
  deadline: string;
  priority?: TaskPriority;
  completed?: boolean;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dateTime?: string;
  deadline?: string;
  priority?: TaskPriority;
  completed?: boolean;
}

export type { AuthStackParamList, AppStackParamList };
