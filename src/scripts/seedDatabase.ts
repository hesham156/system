import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, Task, UserRole } from '../types';

// Demo users data
const demoUsers = [
  {
    email: 'manager@printflow.com',
    password: 'password123',
    name: 'أحمد المدير',
    role: 'manager' as UserRole,
    department: 'الإدارة'
  },
  {
    email: 'sales@printflow.com',
    password: 'password123',
    name: 'سارة المبيعات',
    role: 'sales-manager' as UserRole,
    department: 'المبيعات'
  },
  {
    email: 'design@printflow.com',
    password: 'password123',
    name: 'محمد المصمم',
    role: 'design-team' as UserRole,
    department: 'التصميم'
  },
  {
    email: 'production@printflow.com',
    password: 'password123',
    name: 'ليلى الإنتاج',
    role: 'production-team' as UserRole,
    department: 'الإنتاج'
  }
];

// Demo tasks data
const demoTasks = [
  {
    title: 'تصميم كروت شخصية - شركة ABC',
    description: 'تصميم كروت شخصية احترافية مع شعار الشركة ومعلومات الاتصال',
    clientName: 'شركة ABC للتجارة',
    clientContact: 'john@abccorp.com',
    priority: 'high' as const,
    status: 'in-design' as const,
    assignedTeam: 'design-team' as UserRole,
    dueDate: new Date('2025-01-15'),
    estimatedValue: 500,
    specifications: {
      quantity: 1000,
      size: '9×5 سم',
      material: 'ورق مقوى فاخر',
      colors: '4 ألوان CMYK',
      finishes: ['لامينيشن مطفي'],
      specialInstructions: 'تضمين رمز QR للتواصل الرقمي'
    }
  },
  {
    title: 'تصميم بروشور - شركة XYZ',
    description: 'بروشور ثلاثي الطي يعرض خدمات الشركة وآراء العملاء',
    clientName: 'شركة XYZ المحدودة',
    clientContact: 'sarah@xyzltd.com',
    priority: 'medium' as const,
    status: 'pending-approval' as const,
    assignedTeam: 'design-team' as UserRole,
    dueDate: new Date('2025-01-16'),
    estimatedValue: 750,
    specifications: {
      quantity: 500,
      size: 'A4 (مطوي)',
      material: 'ورق لامع',
      colors: 'ألوان كاملة',
      finishes: ['طلاء UV']
    }
  },
  {
    title: 'طباعة بانر - شركة الفعاليات',
    description: 'بانر كبير الحجم لجناح المعرض التجاري',
    clientName: 'شركة الفعاليات والمؤتمرات',
    clientContact: 'mike@eventco.com',
    priority: 'urgent' as const,
    status: 'in-production' as const,
    assignedTeam: 'production-team' as UserRole,
    dueDate: new Date('2025-01-14'),
    estimatedValue: 1200,
    specifications: {
      quantity: 2,
      size: '3×2.5 متر',
      material: 'فينيل',
      colors: 'ألوان كاملة',
      finishes: ['حلقات معدنية', 'حواف مخيطة']
    }
  }
];

export async function seedDatabase() {
  try {
    console.log('بدء إنشاء البيانات التجريبية...');

    // Create demo users
    const createdUsers: { [key: string]: string } = {};
    
    for (const userData of demoUsers) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          userData.email, 
          userData.password
        );
        
        const userId = userCredential.user.uid;
        createdUsers[userData.role] = userId;
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', userId), {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          department: userData.department,
          createdAt: serverTimestamp(),
          isActive: true
        });
        
        console.log(`تم إنشاء المستخدم: ${userData.name}`);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`المستخدم موجود بالفعل: ${userData.email}`);
        } else {
          console.error(`خطأ في إنشاء المستخدم ${userData.email}:`, error);
        }
      }
    }

    // Create demo tasks
    for (const taskData of demoTasks) {
      try {
        await addDoc(collection(db, 'tasks'), {
          ...taskData,
          createdBy: createdUsers['sales-manager'] || 'demo-user',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          notes: [],
          attachments: []
        });
        
        console.log(`تم إنشاء المهمة: ${taskData.title}`);
      } catch (error) {
        console.error(`خطأ في إنشاء المهمة ${taskData.title}:`, error);
      }
    }

    console.log('تم إنشاء جميع البيانات التجريبية بنجاح!');
    
  } catch (error) {
    console.error('خطأ في إنشاء البيانات التجريبية:', error);
  }
}

// Call this function to seed the database
// seedDatabase();