import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Printer, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await signIn(email, password);
      toast.success('تم تسجيل الدخول بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تسجيل الدخول');
    }
  };

  const fillDemoCredentials = (role: string) => {
    const demoCredentials: Record<string, { email: string; password: string }> = {
      manager: { email: 'manager@printflow.com', password: 'password123' },
      sales: { email: 'sales@printflow.com', password: 'password123' },
      design: { email: 'design@printflow.com', password: 'password123' },
      production: { email: 'production@printflow.com', password: 'password123' },
    };

    const credentials = demoCredentials[role];
    if (credentials) {
      setEmail(credentials.email);
      setPassword(credentials.password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <Printer className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">نظام إدارة المطبعة</h1>
            <p className="text-gray-600">نظام إدارة المهام والمشاريع</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="أدخل بريدك الإلكتروني"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-12"
                  placeholder="أدخل كلمة المرور"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-3">حسابات تجريبية:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fillDemoCredentials('manager')}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded transition-colors"
                >
                  مدير
                </button>
                <button
                  onClick={() => fillDemoCredentials('sales')}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded transition-colors"
                >
                  مبيعات
                </button>
                <button
                  onClick={() => fillDemoCredentials('design')}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded transition-colors"
                >
                  تصميم
                </button>
                <button
                  onClick={() => fillDemoCredentials('production')}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded transition-colors"
                >
                  إنتاج
                </button>
              </div>
              <p className="text-gray-500 mt-3 text-xs">
                ملاحظة: يجب إنشاء هذه الحسابات في Firebase أولاً
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;