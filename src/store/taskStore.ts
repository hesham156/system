import { create } from 'zustand';
import { Task, TaskStatus, statusWorkflow } from '../types';
import { TaskService } from '../services/taskService';
import { UserService } from '../services/userService';
import { useNotificationStore } from './notificationStore';
import { useAuthStore } from './authStore';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  isTaskModalOpen: boolean;
  isCreateModalOpen: boolean;
  isLoading: boolean;
  filters: {
    status: TaskStatus | 'all';
    priority: string;
    assignedTeam: string;
    dateRange: [Date | null, Date | null];
  };
  setTasks: (tasks: Task[]) => void;
  loadTasks: (filters?: any) => Promise<void>;
  subscribeToTasks: (filters?: any) => () => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus, reason?: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addTaskNote: (taskId: string, message: string) => Promise<void>;
  setSelectedTask: (task: Task | null) => void;
  setTaskModalOpen: (isOpen: boolean) => void;
  setCreateModalOpen: (isOpen: boolean) => void;
  setFilters: (filters: Partial<TaskState['filters']>) => void;
  canUpdateStatus: (currentStatus: TaskStatus, newStatus: TaskStatus, userRole: string) => boolean;
  getAvailableStatuses: (currentStatus: TaskStatus, userRole: string) => TaskStatus[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  isTaskModalOpen: false,
  isCreateModalOpen: false,
  isLoading: false,
  filters: {
    status: 'all',
    priority: 'all',
    assignedTeam: 'all',
    dateRange: [null, null],
  },

  setTasks: (tasks) => set({ tasks }),

  loadTasks: async (filters) => {
    try {
      set({ isLoading: true });
      const tasks = await TaskService.getTasks(filters);
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('خطأ في تحميل المهام:', error);
      set({ isLoading: false });
    }
  },

  subscribeToTasks: (filters) => {
    return TaskService.subscribeToTasks((tasks) => {
      set({ tasks });
    }, filters);
  },

  addTask: async (taskData) => {
    try {
      const taskId = await TaskService.createTask(taskData);
      
      // Send notification to assigned team
      const { sendTaskNotification } = useNotificationStore.getState();
      const assignedUsers = await UserService.getTeamMembers(taskData.assignedTeam);
      
      sendTaskNotification(
        'task-assigned',
        assignedUsers,
        taskData.title,
        taskId
      );

      set({ isCreateModalOpen: false });
      
      // Reload tasks to get the updated list
      get().loadTasks();
    } catch (error) {
      console.error('خطأ في إنشاء المهمة:', error);
      throw error;
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      await TaskService.updateTask(taskId, updates);
      
      // Update local state
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
        ),
        selectedTask: state.selectedTask?.id === taskId 
          ? { ...state.selectedTask, ...updates, updatedAt: new Date() }
          : state.selectedTask
      }));
    } catch (error) {
      console.error('خطأ في تحديث المهمة:', error);
      throw error;
    }
  },

  updateTaskStatus: async (taskId, newStatus, reason) => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);
    const { user } = useAuthStore.getState();
    const { sendTaskNotification } = useNotificationStore.getState();
    
    if (!task || !user) return;

    const oldStatus = task.status;
    
    // Check permissions
    if (!state.canUpdateStatus(oldStatus, newStatus, user.role)) {
      throw new Error('ليس لديك صلاحية لتحديث هذه الحالة');
    }

    try {
      await TaskService.updateTaskStatus(taskId, newStatus, user.id, user.name, reason);
      
      // Update local state
      state.updateTask(taskId, { status: newStatus });

      // Send notifications based on status change
      await handleStatusChangeNotifications(task, oldStatus, newStatus, reason);
    } catch (error) {
      console.error('خطأ في تحديث حالة المهمة:', error);
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      await TaskService.deleteTask(taskId);
      
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
        selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask,
        isTaskModalOpen: state.selectedTask?.id === taskId ? false : state.isTaskModalOpen
      }));
    } catch (error) {
      console.error('خطأ في حذف المهمة:', error);
      throw error;
    }
  },

  addTaskNote: async (taskId, message) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      await TaskService.addTaskNote(taskId, {
        userId: user.id,
        userName: user.name,
        message,
        type: 'comment'
      });

      // Reload the specific task to get updated notes
      const updatedTask = await TaskService.getTask(taskId);
      if (updatedTask) {
        set((state) => ({
          tasks: state.tasks.map(task => 
            task.id === taskId ? updatedTask : task
          ),
          selectedTask: state.selectedTask?.id === taskId ? updatedTask : state.selectedTask
        }));
      }
    } catch (error) {
      console.error('خطأ في إضافة الملاحظة:', error);
      throw error;
    }
  },

  setSelectedTask: (selectedTask) => set({ selectedTask }),
  setTaskModalOpen: (isTaskModalOpen) => set({ isTaskModalOpen }),
  setCreateModalOpen: (isCreateModalOpen) => set({ isCreateModalOpen }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  canUpdateStatus: (currentStatus, newStatus, userRole) => {
    const workflow = statusWorkflow[currentStatus];
    if (!workflow) return false;

    return workflow.allowedRoles.includes(userRole as any) && 
           workflow.nextStatuses.includes(newStatus);
  },

  getAvailableStatuses: (currentStatus, userRole) => {
    const workflow = statusWorkflow[currentStatus];
    if (!workflow || !workflow.allowedRoles.includes(userRole as any)) {
      return [];
    }
    return workflow.nextStatuses;
  },
}));

// Helper function for status change notifications
async function handleStatusChangeNotifications(
  task: Task, 
  oldStatus: TaskStatus, 
  newStatus: TaskStatus, 
  reason?: string
) {
  const { sendTaskNotification } = useNotificationStore.getState();
  
  // Notify based on status transitions
  switch (newStatus) {
    case 'pending-approval':
      // Notify manager that approval is needed
      const managers = await UserService.getTeamMembers('manager');
      sendTaskNotification(
        'approval-needed',
        managers,
        task.title,
        task.id
      );
      break;
      
    case 'approved':
      // Notify production team that task is approved
      const productionTeam = await UserService.getTeamMembers('production-team');
      sendTaskNotification(
        'task-approved',
        productionTeam,
        task.title,
        task.id
      );
      // Also notify the creator
      sendTaskNotification(
        'task-approved',
        [task.createdBy],
        task.title,
        task.id
      );
      break;
      
    case 'design-review':
      if (oldStatus === 'pending-approval') {
        // Task was rejected, notify design team
        const designTeam = await UserService.getTeamMembers('design-team');
        sendTaskNotification(
          'task-rejected',
          designTeam,
          task.title,
          task.id,
          { reason }
        );
      }
      break;
      
    case 'delivered':
      // Notify everyone involved that task is completed
      const managers2 = await UserService.getTeamMembers('manager');
      sendTaskNotification(
        'task-completed',
        [task.createdBy, ...managers2],
        task.title,
        task.id
      );
      break;
  }
}