import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import TaskCard from '../components/Tasks/TaskCard';
import TaskModal from '../components/Tasks/TaskModal';
import CreateTaskModal from '../components/Tasks/CreateTaskModal';
import EditTaskModal from '../components/Tasks/EditTaskModal';
import { useTaskStore } from '../store/taskStore';
import { Task, TaskStatus } from '../types';
import toast from 'react-hot-toast';

const Tasks: React.FC = () => {
  const { 
    tasks, 
    selectedTask, 
    isTaskModalOpen, 
    isCreateModalOpen,
    isLoading,
    setSelectedTask, 
    setTaskModalOpen, 
    setCreateModalOpen,
    deleteTask,
    loadTasks
  } = useTaskStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
    setTaskModalOpen(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      try {
        await deleteTask(taskId);
        toast.success('تم حذف المهمة بنجاح');
        setTaskModalOpen(false);
      } catch (error) {
        toast.error('حدث خطأ أثناء حذف المهمة');
      }
    }
  };

  const handleEditFromCard = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleDeleteFromCard = async (taskId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      try {
        await deleteTask(taskId);
        toast.success('تم حذف المهمة بنجاح');
      } catch (error) {
        toast.error('حدث خطأ أثناء حذف المهمة');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">جاري تحميل المهام...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المهام</h1>
          <p className="text-gray-600 mt-1">إدارة ومتابعة جميع مهام الطباعة</p>
        </div>
        <button 
          onClick={() => setCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="w-5 h-5" />
          <span>مهمة جديدة</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث في المهام..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending-design">في انتظار التصميم</option>
              <option value="in-design">قيد التصميم</option>
              <option value="design-review">مراجعة التصميم</option>
              <option value="pending-approval">في انتظار الموافقة</option>
              <option value="approved">تمت الموافقة</option>
              <option value="in-production">قيد الإنتاج</option>
              <option value="ready-delivery">جاهز للتسليم</option>
              <option value="delivered">تم التسليم</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => handleTaskClick(task)}
            onEdit={() => handleEditFromCard(task)}
            onDelete={() => handleDeleteFromCard(task.id)}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {tasks.length === 0 ? 'لا توجد مهام بعد. ابدأ بإنشاء مهمة جديدة!' : 'لا توجد مهام تطابق معايير البحث'}
          </p>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          onEdit={() => handleEditTask(selectedTask)}
          onDelete={() => handleDeleteTask(selectedTask.id)}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
      />
    </div>
  );
};

export default Tasks;