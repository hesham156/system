import { create } from 'zustand';
import { notificationTemplates, type Notification } from '../types';
import { NotificationService } from '../services/notificationService';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  loadNotifications: (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  clearNotifications: (userId: string) => Promise<void>;
  sendTaskNotification: (
    type: keyof typeof notificationTemplates,
    userIds: string[],
    taskTitle: string,
    taskId: string,
    additionalData?: any
  ) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  loadNotifications: async (userId: string) => {
    try {
      set({ isLoading: true });
      const notifications = await NotificationService.getUserNotifications(userId);
      const unreadCount = notifications.filter(n => !n.isRead).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error) {
      console.error('خطأ في تحميل الإشعارات:', error);
      set({ isLoading: false });
    }
  },

  subscribeToNotifications: (userId: string) => {
    return NotificationService.subscribeToUserNotifications(userId, (notifications) => {
      const unreadCount = notifications.filter(n => !n.isRead).length;
      set({ notifications, unreadCount });
    });
  },

  addNotification: async (notification) => {
    try {
      await NotificationService.createNotification(notification);
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/vite.svg',
          badge: '/vite.svg',
          tag: notification.taskId || 'general',
          requireInteraction: notification.priority === 'high',
          silent: notification.priority === 'low'
        });
      }

      // Play notification sound for high priority
      if (notification.priority === 'high') {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors if audio fails
      }
    } catch (error) {
      console.error('خطأ في إنشاء الإشعار:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('خطأ في تحديث الإشعار:', error);
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      await NotificationService.markAllAsRead(userId);
      
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('خطأ في تحديث جميع الإشعارات:', error);
    }
  },

  clearNotifications: async (userId: string) => {
    try {
      await NotificationService.clearUserNotifications(userId);
      
      set({
        notifications: [],
        unreadCount: 0,
      });
    } catch (error) {
      console.error('خطأ في مسح الإشعارات:', error);
    }
  },

  sendTaskNotification: async (type, userIds, taskTitle, taskId, additionalData) => {
    const template = notificationTemplates[type];
    if (!template) return;

    try {
      const promises = userIds.map(userId => 
        get().addNotification({
          userId,
          title: template.title,
          message: template.message(taskTitle, additionalData?.newStatus, additionalData?.reason),
          type,
          taskId,
          priority: template.priority,
          isRead: false,
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('خطأ في إرسال الإشعارات:', error);
    }
  },
}));