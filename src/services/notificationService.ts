import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification } from '../types';

export class NotificationService {
  private static readonly COLLECTION_NAME = 'notifications';

  static async createNotification(
    notificationData: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...notificationData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('خطأ في إنشاء الإشعار:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.COLLECTION_NAME, notificationId);
      await updateDoc(notificationRef, {
        isRead: true
      });
    } catch (error) {
      console.error('خطأ في تحديث الإشعار:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('خطأ في تحديث جميع الإشعارات:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Notification));
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
      throw error;
    }
  }

  static subscribeToUserNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Notification));
      callback(notifications);
    }, (error) => {
      console.error('خطأ في الاستماع للإشعارات:', error);
    });
  }

  static async clearUserNotifications(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('خطأ في مسح الإشعارات:', error);
      throw error;
    }
  }
}