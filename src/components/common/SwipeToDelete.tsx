import React from 'react';
import { motion, PanInfo } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
}

export const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({ children, onDelete, deleteLabel = 'Delete' }) => {
  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -90) {
      onDelete();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background Delete Action Reveal */}
      <div className="absolute inset-0 bg-red-600 rounded-2xl flex items-center justify-end pr-6 text-white text-xs font-bold gap-2 shadow-inner">
        <Trash2 className="w-4 h-4 animate-pulse" /> {deleteLabel}
      </div>

      {/* Draggable Foreground Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        className="relative bg-white z-10 w-full cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
};
