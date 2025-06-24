# نظام إدارة المطبعة - PrintFlow

نظام شامل لإدارة مهام ومشاريع المطبعة مع Firebase كقاعدة بيانات.

## الميزات الرئيسية

- **إدارة المهام**: إنشاء وتتبع ومتابعة مهام الطباعة
- **نظام الأدوار**: أدوار مختلفة (مدير، مبيعات، تصميم، إنتاج)
- **الإشعارات الفورية**: إشعارات في الوقت الفعلي لتحديثات المهام
- **تتبع الحالة**: نظام متقدم لتتبع حالة المهام
- **المواصفات الفنية**: تفاصيل شاملة لكل مهمة
- **التعليقات والملاحظات**: نظام تعليقات متكامل

## التقنيات المستخدمة

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Firebase (Firestore + Authentication)
- **State Management**: Zustand
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## إعداد المشروع

### 1. تثبيت المتطلبات

```bash
npm install
```

### 2. إعداد Firebase

1. إنشاء مشروع Firebase جديد
2. تفعيل Authentication و Firestore
3. نسخ إعدادات Firebase إلى `src/lib/firebase.ts`

### 3. إنشاء البيانات التجريبية

```bash
# في وحدة التحكم في المتصفح، قم بتشغيل:
import { seedDatabase } from './src/scripts/seedDatabase';
seedDatabase();
```

### 4. تشغيل المشروع

```bash
npm run dev
```

## الحسابات التجريبية

- **المدير**: manager@printflow.com / password123
- **المبيعات**: sales@printflow.com / password123  
- **التصميم**: design@printflow.com / password123
- **الإنتاج**: production@printflow.com / password123

## هيكل قاعدة البيانات

### مجموعة Users
```javascript
{
  id: string,
  email: string,
  name: string,
  role: 'manager' | 'sales-manager' | 'design-team' | 'production-team',
  department: string,
  createdAt: timestamp,
  isActive: boolean
}
```

### مجموعة Tasks
```javascript
{
  id: string,
  title: string,
  description: string,
  clientName: string,
  clientContact: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  status: 'pending-design' | 'in-design' | 'pending-approval' | ...,
  assignedTeam: UserRole,
  createdBy: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  dueDate: timestamp,
  estimatedValue: number,
  specifications: {
    quantity: number,
    size: string,
    material: string,
    colors: string,
    finishes: string[],
    specialInstructions?: string
  },
  notes: TaskNote[],
  attachments: string[]
}
```

### مجموعة Notifications
```javascript
{
  id: string,
  userId: string,
  title: string,
  message: string,
  type: 'task-assigned' | 'task-updated' | 'approval-needed' | ...,
  taskId?: string,
  priority: 'low' | 'medium' | 'high',
  isRead: boolean,
  createdAt: timestamp
}
```

## سير العمل

1. **إنشاء المهمة**: فريق المبيعات ينشئ مهمة جديدة
2. **التصميم**: فريق التصميم يعمل على المهمة
3. **المراجعة**: مراجعة التصميم داخلياً
4. **الموافقة**: المدير يوافق على المهمة
5. **الإنتاج**: فريق الإنتاج ينفذ المهمة
6. **التسليم**: تسليم المهمة للعميل

## الأمان والصلاحيات

- كل دور له صلاحيات محددة لتحديث حالات المهام
- المدير فقط يمكنه الموافقة على المهام
- نظام إشعارات متقدم لتتبع التغييرات

## المساهمة

نرحب بالمساهمات! يرجى إنشاء Pull Request أو فتح Issue للمناقشة.

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.# system
# system
