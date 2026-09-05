import mongoose, { Document, Schema, Types } from 'mongoose';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface ITask extends Document {
  userId: Types.ObjectId;
  title: string;
  description: string;
  dateTime: Date;
  deadline: Date;
  priority: TaskPriority;
  completed: boolean;
  createdAt: Date;
}

const taskSchema = new Schema<ITask>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  dateTime: {
    type: Date,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;
