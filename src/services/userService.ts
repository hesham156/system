import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, UserRole } from '../types';

export class UserService {
  private static readonly COLLECTION_NAME = 'users';

  static async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, this.COLLECTION_NAME, userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: userDoc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          department: data.department,
          avatar: data.avatar,
          createdAt: data.createdAt?.toDate() || new Date(),
          isActive: data.isActive ?? true,
          notificationToken: data.notificationToken
        };
      }
      return null;
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدم:', error);
      throw error;
    }
  }

  static async getUsers(filters?: {
    role?: UserRole;
    department?: string;
    isActive?: boolean;
  }): Promise<User[]> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME), orderBy('name'));

      if (filters?.role) {
        q = query(q, where('role', '==', filters.role));
      }
      if (filters?.department) {
        q = query(q, where('department', '==', filters.department));
      }
      if (filters?.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          department: data.department,
          avatar: data.avatar,
          createdAt: data.createdAt?.toDate() || new Date(),
          isActive: data.isActive ?? true,
          notificationToken: data.notificationToken
        };
      });
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      throw error;
    }
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('خطأ في تحديث المستخدم:', error);
      throw error;
    }
  }

  static async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.getUsers({ role });
  }

  static async getTeamMembers(team: UserRole): Promise<string[]> {
    try {
      const users = await this.getUsersByRole(team);
      return users.map(user => user.id);
    } catch (error) {
      console.error('خطأ في جلب أعضاء الفريق:', error);
      return [];
    }
  }
}