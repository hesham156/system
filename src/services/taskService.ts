import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Task, TaskStatus, TaskNote } from '../types';

export class TaskService {
  private static readonly COLLECTION_NAME = 'tasks';

  static async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dueDate: Timestamp.fromDate(taskData.dueDate)
      });
      return docRef.id;
    } catch (error) {
      console.error('خطأ في إنشاء المهمة:', error);
      throw error;
    }
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const taskRef = doc(db, this.COLLECTION_NAME, taskId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Convert Date objects to Timestamps
      if (updates.dueDate) {
        updateData.dueDate = Timestamp.fromDate(updates.dueDate);
      }
      if (updates.completedAt) {
        updateData.completedAt = Timestamp.fromDate(updates.completedAt);
      }

      await updateDoc(taskRef, updateData);
    } catch (error) {
      console.error('خطأ في تحديث المهمة:', error);
      throw error;
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, taskId));
    } catch (error) {
      console.error('خطأ في حذف المهمة:', error);
      throw error;
    }
  }

  static async getTask(taskId: string): Promise<Task | null> {
    try {
      const taskDoc = await getDoc(doc(db, this.COLLECTION_NAME, taskId));
      if (taskDoc.exists()) {
        return this.convertFirestoreTask(taskDoc.id, taskDoc.data());
      }
      return null;
    } catch (error) {
      console.error('خطأ في جلب المهمة:', error);
      throw error;
    }
  }

  static async getTasks(filters?: {
    status?: TaskStatus;
    assignedTeam?: string;
    createdBy?: string;
  }): Promise<Task[]> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME), orderBy('createdAt', 'desc'));

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.assignedTeam) {
        q = query(q, where('assignedTeam', '==', filters.assignedTeam));
      }
      if (filters?.createdBy) {
        q = query(q, where('createdBy', '==', filters.createdBy));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertFirestoreTask(doc.id, doc.data())
      );
    } catch (error) {
      console.error('خطأ في جلب المهام:', error);
      throw error;
    }
  }

  static subscribeToTasks(
    callback: (tasks: Task[]) => void,
    filters?: {
      status?: TaskStatus;
      assignedTeam?: string;
      createdBy?: string;
    }
  ): () => void {
    let q = query(collection(db, this.COLLECTION_NAME), orderBy('createdAt', 'desc'));

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.assignedTeam) {
      q = query(q, where('assignedTeam', '==', filters.assignedTeam));
    }
    if (filters?.createdBy) {
      q = query(q, where('createdBy', '==', filters.createdBy));
    }

    return onSnapshot(q, (querySnapshot) => {
      const tasks = querySnapshot.docs.map(doc => 
        this.convertFirestoreTask(doc.id, doc.data())
      );
      callback(tasks);
    }, (error) => {
      console.error('خطأ في الاستماع للمهام:', error);
    });
  }

  static async addTaskNote(taskId: string, note: Omit<TaskNote, 'id' | 'createdAt'>): Promise<void> {
    try {
      const taskRef = doc(db, this.COLLECTION_NAME, taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        throw new Error('المهمة غير موجودة');
      }

      const taskData = taskDoc.data();
      const newNote: TaskNote = {
        ...note,
        id: Date.now().toString(),
        createdAt: new Date()
      };

      const updatedNotes = [...(taskData.notes || []), newNote];
      
      await updateDoc(taskRef, {
        notes: updatedNotes,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('خطأ في إضافة الملاحظة:', error);
      throw error;
    }
  }

  static async updateTaskStatus(
    taskId: string, 
    newStatus: TaskStatus, 
    userId: string, 
    userName: string,
    reason?: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const taskRef = doc(db, this.COLLECTION_NAME, taskId);
      
      // Update task status
      batch.update(taskRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Add status change note
      const taskDoc = await getDoc(taskRef);
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        const statusNote: TaskNote = {
          id: Date.now().toString(),
          userId,
          userName,
          message: `تم تغيير حالة المهمة إلى "${newStatus}"${reason ? ` - السبب: ${reason}` : ''}`,
          createdAt: new Date(),
          type: 'status-change'
        };

        const updatedNotes = [...(taskData.notes || []), statusNote];
        batch.update(taskRef, { notes: updatedNotes });
      }

      await batch.commit();
    } catch (error) {
      console.error('خطأ في تحديث حالة المهمة:', error);
      throw error;
    }
  }

  private static convertFirestoreTask(id: string, data: any): Task {
    return {
      id,
      title: data.title,
      description: data.description,
      clientName: data.clientName,
      clientContact: data.clientContact,
      priority: data.priority,
      status: data.status,
      assignedTo: data.assignedTo,
      assignedTeam: data.assignedTeam,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      dueDate: data.dueDate?.toDate() || new Date(),
      estimatedValue: data.estimatedValue || 0,
      actualValue: data.actualValue,
      completedAt: data.completedAt?.toDate(),
      notes: data.notes || [],
      attachments: data.attachments || [],
      specifications: data.specifications || {
        quantity: 0,
        size: '',
        material: '',
        colors: '',
        finishes: []
      }
    };
  }
}