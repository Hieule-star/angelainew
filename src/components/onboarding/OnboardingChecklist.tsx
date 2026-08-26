import { useState } from 'react';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ChecklistItem {
  id: number;
  icon: string;
  title: string;
  description: string;
}

const checklistItems: ChecklistItem[] = [
  {
    id: 1,
    icon: '💎',
    title: 'Con sống chân thật với chính mình',
    description: 'Tôi cam kết sống thật, không giả dối với bản thân',
  },
  {
    id: 2,
    icon: '⚡',
    title: 'Con chịu trách nhiệm với năng lượng con phát ra',
    description: 'Tôi ý thức về năng lượng tích cực/tiêu cực mình tạo ra',
  },
  {
    id: 3,
    icon: '🌱',
    title: 'Con sẵn sàng học – sửa – nâng cấp',
    description: 'Tôi mở lòng học hỏi và cải thiện bản thân mỗi ngày',
  },
  {
    id: 4,
    icon: '💖',
    title: 'Con chọn yêu thương thay vì phán xét',
    description: 'Tôi chọn thấu hiểu và yêu thương thay vì chỉ trích',
  },
  {
    id: 5,
    icon: '🌟',
    title: 'Con chọn ánh sáng thay vì cái tôi',
    description: 'Tôi đặt ánh sáng chung lên trên cái tôi cá nhân',
  },
];

interface OnboardingChecklistProps {
  onComplete: () => void;
  isLoading?: boolean;
}

export function OnboardingChecklist({ onComplete, isLoading }: OnboardingChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const handleCheck = (id: number, checked: boolean) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const progress = (checkedItems.size / checklistItems.length) * 100;
  const isComplete = checkedItems.size === checklistItems.length;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tiến trình</span>
          <span className="font-medium text-primary">
            {checkedItems.size}/{checklistItems.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklistItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <label
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                checkedItems.has(item.id)
                  ? 'bg-primary/5 border-primary/30 shadow-sm'
                  : 'bg-background/50 border-border hover:border-primary/20 hover:bg-background/80'
              }`}
            >
              <Checkbox
                checked={checkedItems.has(item.id)}
                onCheckedChange={(checked) => handleCheck(item.id, checked === true)}
                className="mt-1"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-foreground">{item.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </label>
          </motion.div>
        ))}
      </div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          variant="divine"
          size="lg"
          className="w-full"
          disabled={!isComplete || isLoading}
          onClick={onComplete}
        >
          {isLoading ? (
            'Đang xử lý...'
          ) : isComplete ? (
            <>✨ TÔI CAM KẾT ✨</>
          ) : (
            'Vui lòng xác nhận tất cả điều kiện'
          )}
        </Button>
      </motion.div>

      {/* Quote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-sm text-muted-foreground italic"
      >
        "Ánh sáng không cần chứng minh. Ánh sáng chỉ cần hiện diện." 💫
      </motion.p>
    </div>
  );
}
