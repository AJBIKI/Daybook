import mongoose, { Schema, type HydratedDocument, type InferSchemaType } from 'mongoose';

const taskSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    priority: {
      type: Number,
      enum: [1, 2, 3],
      default: 2,
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Serves Today summary counts, overdue/upcoming queries, and dueDate-filtered task lists.
taskSchema.index({ userId: 1, completed: 1, dueDate: 1 });
// Serves default newest-first task list pagination per user.
taskSchema.index({ userId: 1, createdAt: -1 });

export type TaskDocument = HydratedDocument<InferSchemaType<typeof taskSchema>>;
export type TaskPriority = 1 | 2 | 3;

export interface PublicTask {
  id: string;
  userId: string;
  title: string;
  notes: string;
  priority: TaskPriority;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAggregateRow {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  notes: string;
  priority: number;
  dueDate: Date | null;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicTask(task: TaskDocument | TaskAggregateRow): PublicTask {
  return {
    id: task._id.toString(),
    userId: task.userId.toString(),
    title: task.title,
    notes: task.notes,
    priority: task.priority as TaskPriority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    completed: task.completed,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export const TaskModel = mongoose.model('Task', taskSchema);
