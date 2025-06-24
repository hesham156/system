import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, UserRole } from '../types';

export class AuthService {
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('بيانات المستخدم غير موجودة');
      }
      
      const userData = userDoc.data();
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        avatar: userData.avatar,
        createdAt: userData.createdAt?.toDate() || new Date(),
        isActive: userData.isActive ?? true,
        notificationToken: userData.notificationToken
      };
    } catch (error: any) {
      console.error('خطأ في تسجيل الدخول:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  static async signUp(
    email: string, 
    password: string, 
    name: string, 
    role: UserRole, 
    department: string
  ): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email!,
        name,
        role,
        department,
        createdAt: new Date(),
        isActive: true
      };
      
      // Save user data to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp()
      });
      
      return {
        id: firebaseUser.uid,
        ...userData
      };
    } catch (error: any) {
      console.error('خطأ في إنشاء الحساب:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      throw error;
    }
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userData.name,
              role: userData.role,
              department: userData.department,
              avatar: userData.avatar,
              createdAt: userData.createdAt?.toDate() || new Date(),
              isActive: userData.isActive ?? true,
              notificationToken: userData.notificationToken
            };
            callback(user);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات المستخدم:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  private static getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'المستخدم غير موجود',
      'auth/wrong-password': 'كلمة المرور غير صحيحة',
      'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
      'auth/weak-password': 'كلمة المرور ضعيفة',
      'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
      'auth/too-many-requests': 'تم تجاوز عدد المحاولات المسموح',
      'auth/network-request-failed': 'خطأ في الاتصال بالشبكة'
    };
    
    return errorMessages[errorCode] || 'حدث خطأ غير متوقع';
  }
}