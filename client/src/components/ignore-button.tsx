import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EyeOff, Eye, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Transaction } from '@shared/schema';

interface IgnoreButtonProps {
  transaction: Transaction;
  onIgnoreChange: (ignoreType: string) => void;
}

type IgnoreType = 'none' | 'budget' | 'everything';

const IGNORE_OPTIONS = [
  {
    value: 'none' as IgnoreType,
    label: "Don't ignore",
    description: "Include in all calculations and reports"
  },
  {
    value: 'budget' as IgnoreType,
    label: "Ignore from Budget",
    description: "Exclude from budget tracking only"
  },
  {
    value: 'everything' as IgnoreType,
    label: "Ignore from Everything",
    description: "Exclude from all spending reports and charts"
  }
];

export function IgnoreButton({ transaction, onIgnoreChange }: IgnoreButtonProps) {
  const [open, setOpen] = useState(false);
  
  // Get current ignore type, default to 'none' if not set
  const currentIgnoreType = (transaction.ignoreType || 'none') as IgnoreType;
  const isIgnored = currentIgnoreType !== 'none';
  
  // Get tooltip content based on current state
  const getTooltipContent = () => {
    switch (currentIgnoreType) {
      case 'budget':
        return 'Ignored from budget tracking';
      case 'everything':
        return 'Ignored from all reports and charts';
      default:
        return 'Click to ignore transaction';
    }
  };

  const handleIgnoreChange = (newIgnoreType: IgnoreType) => {
    onIgnoreChange(newIgnoreType);
    setOpen(false);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "h-7 w-7 p-0 sm:h-8 sm:w-8 transition-all",
                  isIgnored 
                    ? "text-orange-600 hover:text-orange-700 bg-orange-50 border-orange-200 hover:border-orange-300"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                )}
                title={getTooltipContent()}
                data-testid={`ignore-button-${transaction.id}`}
              >
                {isIgnored ? (
                  <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          
          <PopoverContent className="w-64 p-0" align="end">
            <div className="p-1">
              <div className="px-3 py-2 text-sm font-medium text-foreground border-b">
                Ignore Options
              </div>
              <div className="py-1">
                {IGNORE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleIgnoreChange(option.value)}
                    className={cn(
                      "flex items-start gap-3 w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left",
                      currentIgnoreType === option.value && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                    data-testid={`ignore-option-${option.value}`}
                  >
                    <div className="flex items-center justify-center w-4 h-4 mt-0.5">
                      {currentIgnoreType === option.value && (
                        <Check className="w-3 h-3 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">
                        {option.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}