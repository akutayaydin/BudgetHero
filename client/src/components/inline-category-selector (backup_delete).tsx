import React, { useState, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

// Enhanced category icons mapping
const getCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  const iconMap: Record<string, string> = {
    // Food & Dining
    'food & dining': '🍔',
    'fast food': '🍟',
    'restaurants': '🍽️',
    'coffee shops': '☕',
    'bars & nightlife': '🍺',
    'dining': '🍽️',
    
    // Groceries & Shopping
    'groceries': '🛒',
    'grocery': '🛒',
    'shopping': '🛍️',
    'retail': '🏪',
    'clothing': '👔',
    'electronics': '📱',
    'home & garden': '🏡',
    
    // Transportation
    'transportation': '🚗',
    'gas': '⛽',
    'fuel': '⛽',
    'taxi & ride shares': '🚕',
    'uber': '🚕',
    'lyft': '🚕',
    'public transportation': '🚌',
    'parking': '🅿️',
    'auto & transport': '🚗',
    
    // Entertainment
    'entertainment': '🎬',
    'movies': '🎬',
    'music': '🎵',
    'streaming': '📺',
    'subscriptions & entertainment': '🎮',
    'hobbies': '🎨',
    'sports': '⚽',
    
    // Bills & Utilities
    'bills & utilities': '⚡',
    'utilities': '⚡',
    'electricity': '⚡',
    'water': '💧',
    'internet': '🌐',
    'phone': '📞',
    'mobile phone': '📱',
    'cable': '📺',
    
    // Health & Healthcare
    'healthcare': '🏥',
    'medical': '🏥',
    'pharmacy': '💊',
    'dentist': '🦷',
    'fitness': '💪',
    'gym': '🏋️',
    
    // Travel & Vacation
    'travel & vacation': '✈️',
    'travel': '✈️',
    'vacation': '🏖️',
    'hotels': '🏨',
    'flights': '✈️',
    
    // Housing & Home
    'housing': '🏠',
    'rent': '🏠',
    'mortgage': '🏠',
    'home improvement': '🔨',
    'maintenance': '🔧',
    
    // Education
    'education': '📚',
    'school': '🎓',
    'books': '📖',
    'courses': '📚',
    
    // Personal Care
    'personal care': '💄',
    'beauty': '💅',
    'haircare': '💇',
    'spa': '🧖',
    
    // Family & Kids
    'family & kids': '👶',
    'childcare': '👶',
    'toys': '🧸',
    'family': '👨‍👩‍👧‍👦',
    
    // Business & Services
    'business services': '💼',
    'professional services': '👔',
    'legal': '⚖️',
    'consulting': '💼',
    
    // Financial & Banking
    'financial': '💰',
    'banking': '🏦',
    'fees': '💸',
    'credit card payment': '💳',
    'investment': '📈',
    'insurance': '🛡️',
    
    // Income
    'income': '💵',
    'salary': '💰',
    'bonus': '💸',
    'freelance': '💻',
    'interest': '💹',
    
    // Government & Taxes
    'government': '🏛️',
    'taxes': '📄',
    'tax': '📄',
    
    // Default
    'uncategorized': '❓',
    'transfer': '🔄',
    'other': '📝'
  };
  
  // Try exact match first
  if (iconMap[name]) return iconMap[name];
  
  // Try partial matches
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key) || key.includes(name)) {
      return icon;
    }
  }
  
  return iconMap['uncategorized'];
};

interface Category {
  id: string;
  name: string;
  subcategory?: string;
  parent?: {
    id: string;
    name: string;
  };
}

interface InlineCategorySelectorProps {
  currentCategoryId?: string;
  currentCategoryName?: string;
  onCategoryChange: (categoryId: string, categoryName: string) => void;
  className?: string;
  disabled?: boolean;
}

export function InlineCategorySelector({
  currentCategoryId,
  currentCategoryName = 'Select category...',
  onCategoryChange,
  className,
  disabled = false
}: InlineCategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Fetch categories
  const { data: adminCategories = [], isLoading } = useQuery({
    queryKey: ['/api/admin/categories'],
  });

  // Transform admin categories into grouped structure
  const categoriesByGroup = useMemo(() => {
    return (adminCategories as any[]).reduce((acc: any, category: any) => {
      const mainCategory = category.name;
      if (!acc[mainCategory]) {
        acc[mainCategory] = [];
      }
      
      const displayName = category.subcategory || category.name;
      const fullName = category.subcategory ? `${category.name} - ${category.subcategory}` : category.name;
      
      acc[mainCategory].push({
        id: category.id,
        name: displayName,
        fullName: fullName,
        mainCategory: category.name,
        subcategory: category.subcategory,
        color: category.color,
        ledgerType: category.ledgerType,
        budgetType: category.budgetType
      });
      return acc;
    }, {});
  }, [adminCategories]);

  // Flatten all categories for searching
  const allCategories = useMemo(() => {
    return Object.values(categoriesByGroup).flat() as any[];
  }, [categoriesByGroup]);

  // Create searchable category list with icons and better formatting
  const searchableCategories = useMemo(() => {
    return allCategories.map(category => {
      const icon = getCategoryIcon(category.fullName);
      
      return {
        id: category.id,
        name: category.name,
        displayName: category.fullName,
        icon,
        mainCategory: category.mainCategory,
        subcategory: category.subcategory,
        color: category.color,
        searchTerms: [
          category.name.toLowerCase(),
          category.mainCategory.toLowerCase(),
          category.subcategory?.toLowerCase() || '',
          category.fullName.toLowerCase()
        ].filter(Boolean).join(' ')
      };
    });
  }, [allCategories]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchValue.trim()) return searchableCategories;
    
    const search = searchValue.toLowerCase();
    return searchableCategories.filter(category => 
      category.searchTerms.includes(search)
    );
  }, [searchableCategories, searchValue]);

  // Group categories by parent for better organization
  const groupedCategories = useMemo(() => {
    const groups: Record<string, typeof filteredCategories> = {};
    
    filteredCategories.forEach(category => {
      const groupKey = category.mainCategory || 'Other';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(category);
    });
    
    return groups;
  }, [filteredCategories]);

  const currentCategory = searchableCategories.find(cat => cat.id === currentCategoryId);
  const currentDisplayName = currentCategory?.displayName || currentCategoryName;
  const currentIcon = currentCategory?.icon || getCategoryIcon(currentCategoryName);

  const handleSelect = (category: any) => {
    // For your existing transactions, we need to pass the display name (subcategory)
    // rather than the full "Main - Sub" format since your transactions use simple category names
    const categoryName = category.subcategory || category.mainCategory;
    onCategoryChange(category.id, categoryName);
    setOpen(false);
    setSearchValue('');
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className={cn("w-full justify-start text-left font-normal", className)}
        disabled
      >
        Loading categories...
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal hover:bg-gray-50",
            className
          )}
          disabled={disabled}
          data-testid="category-selector-trigger"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0">{currentIcon}</span>
            <span className="truncate">{currentDisplayName}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search categories..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList className="max-h-[300px] overflow-auto">
            <CommandEmpty>No categories found.</CommandEmpty>
            
            {Object.entries(groupedCategories).map(([groupName, groupCategories]) => (
              <CommandGroup key={groupName} heading={groupName}>
                {groupCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.searchTerms}
                    onSelect={() => handleSelect(category)}
                    className="cursor-pointer"
                    data-testid={`category-option-${category.id}`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{category.icon}</span>
                      <span className="flex-1">{category.displayName}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        currentCategoryId === category.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Also export a simplified badge version for display-only purposes
interface CategoryBadgeProps {
  categoryName: string;
  className?: string;
}

export function CategoryBadge({ categoryName, className }: CategoryBadgeProps) {
  const icon = getCategoryIcon(categoryName);
  
  return (
    <Badge variant="secondary" className={cn("flex items-center gap-1", className)}>
      <span className="text-sm">{icon}</span>
      <span>{categoryName}</span>
    </Badge>
  );
}