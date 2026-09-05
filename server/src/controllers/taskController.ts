import { Response } from 'express';
import mongoose from 'mongoose';
import Task, { TaskPriority } from '../models/Task';
import { AuthRequest } from '../middleware/authMiddleware';

const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

// POST /api/tasks
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { title, description, dateTime, deadline, priority, completed } = req.body as {
      title?: unknown;
      description?: unknown;
      dateTime?: unknown;
      deadline?: unknown;
      priority?: unknown;
      completed?: unknown;
    };

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    if (!dateTime) {
      res.status(400).json({ message: 'dateTime is required' });
      return;
    }

    const parsedDateTime = new Date(dateTime as string | number | Date);
    if (isNaN(parsedDateTime.getTime())) {
      res.status(400).json({ message: 'Invalid dateTime format' });
      return;
    }

    if (!deadline) {
      res.status(400).json({ message: 'deadline is required' });
      return;
    }

    const parsedDeadline = new Date(deadline as string | number | Date);
    if (isNaN(parsedDeadline.getTime())) {
      res.status(400).json({ message: 'Invalid deadline format' });
      return;
    }

    let taskPriority: TaskPriority = 'medium';
    if (priority !== undefined) {
      if (typeof priority !== 'string' || !VALID_PRIORITIES.includes(priority as TaskPriority)) {
        res.status(400).json({ message: 'Priority must be low, medium, or high' });
        return;
      }
      taskPriority = priority as TaskPriority;
    }

    const task = await Task.create({
      userId,
      title: title.trim(),
      description: typeof description === 'string' ? description : '',
      dateTime: parsedDateTime,
      deadline: parsedDeadline,
      priority: taskPriority,
      completed: typeof completed === 'boolean' ? completed : false,
    });

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating task' });
  }
};

// GET /api/tasks
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid task ID' });
      return;
    }

    const { title, description, dateTime, deadline, priority, completed } = req.body as {
      title?: unknown;
      description?: unknown;
      dateTime?: unknown;
      deadline?: unknown;
      priority?: unknown;
      completed?: unknown;
    };

    const updates: Partial<{
      title: string;
      description: string;
      dateTime: Date;
      deadline: Date;
      priority: TaskPriority;
      completed: boolean;
    }> = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        res.status(400).json({ message: 'Title cannot be empty' });
        return;
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        res.status(400).json({ message: 'Description must be a string' });
        return;
      }
      updates.description = description;
    }

    if (dateTime !== undefined) {
      const parsedDateTime = new Date(dateTime as string | number | Date);
      if (isNaN(parsedDateTime.getTime())) {
        res.status(400).json({ message: 'Invalid dateTime format' });
        return;
      }
      updates.dateTime = parsedDateTime;
    }

    if (deadline !== undefined) {
      const parsedDeadline = new Date(deadline as string | number | Date);
      if (isNaN(parsedDeadline.getTime())) {
        res.status(400).json({ message: 'Invalid deadline format' });
        return;
      }
      updates.deadline = parsedDeadline;
    }

    if (priority !== undefined) {
      if (typeof priority !== 'string' || !VALID_PRIORITIES.includes(priority as TaskPriority)) {
        res.status(400).json({ message: 'Priority must be low, medium, or high' });
        return;
      }
      updates.priority = priority as TaskPriority;
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        res.status(400).json({ message: 'Completed must be a boolean' });
        return;
      }
      updates.completed = completed;
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating task' });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid task ID' });
      return;
    }

    const deletedTask = await Task.findOneAndDelete({ _id: id, userId });

    if (!deletedTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};
