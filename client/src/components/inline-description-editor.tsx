import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineDescriptionEditorProps {
  currentDescription: string;
  onDescriptionChange: (newDescription: string) => void;
  className?: string;
  disabled?: boolean;
}

export function InlineDescriptionEditor({
  currentDescription,
  onDescriptionChange,
  className,
  disabled = false
}: InlineDescriptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentDescription || '');

  const handleSave = () => {
    if (editValue.trim() && editValue !== (currentDescription || '')) {
      onDescriptionChange(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(currentDescription || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-7 text-xs"
          autoFocus
          data-testid="description-input"
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
          onClick={handleSave}
          data-testid="save-description"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
          onClick={handleCancel}
          data-testid="cancel-description"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex items-center gap-1 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1 py-0.5 transition-colors",
        className
      )}
      onClick={() => !disabled && setIsEditing(true)}
      data-testid="description-display"
    >
      <span className="flex-1 text-xs text-foreground truncate">
        {currentDescription}
      </span>
      <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
}