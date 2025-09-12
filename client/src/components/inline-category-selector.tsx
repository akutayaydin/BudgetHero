import React, { useState, useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface Category {
  id: string;
  name: string;
  subcategory?: string;
  parent?: {
    id: string;
    name: string;
  };
}

export function findCategoryByName(
  categories: Category[],
  categoryName: string,
) {
  if (!Array.isArray(categories) || !categoryName) return undefined;
  const target = categoryName.trim().toLowerCase();

  const match = categories.find((cat) => {
    const main = cat.parent?.name?.toLowerCase() || cat.name.toLowerCase();
    const sub = cat.subcategory
      ? cat.subcategory.toLowerCase()
      : cat.parent
      ? cat.name.toLowerCase()
      : undefined;
    const full = cat.subcategory
      ? `${cat.name} - ${cat.subcategory}`.toLowerCase()
      : cat.parent
      ? `${cat.parent.name} - ${cat.name}`.toLowerCase()
      : cat.name.toLowerCase();

    return [main, sub, full].filter(Boolean).includes(target);
  });

  if (!match) return undefined;

  const fullName = match.subcategory
    ? `${match.name} - ${match.subcategory}`
    : match.parent
    ? `${match.parent.name} - ${match.name}`
    : match.name;

  return { id: match.id, fullName };
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
  currentCategoryName = "Select category...",
  onCategoryChange,
  className,
  disabled = false,
}: InlineCategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Fetch transaction categories for transaction categorization  
  const { data: adminCategories = [], isLoading } = useQuery({
    queryKey: ["/api/transaction-categories"],
  });

  // Transform admin categories into grouped structure
  const categoriesByGroup = useMemo(() => {
    return (adminCategories as any[]).reduce((acc: any, category: any) => {
      const mainCategory = category.parent?.name || category.name;
      const subcategory = category.parent ? category.name : category.subcategory;
      const displayName = subcategory || mainCategory;
      const fullName = subcategory
        ? `${mainCategory} - ${subcategory}`
        : mainCategory;

     
      if (!acc[mainCategory]) {
        acc[mainCategory] = [];
      }



      acc[mainCategory].push({
        id: category.id,
        name: displayName,
        fullName,
        mainCategory,
        subcategory,
        color: category.color,
        ledgerType: category.ledgerType,
        budgetType: category.budgetType,
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
    return allCategories.map((category) => {
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
          category.subcategory?.toLowerCase() || "",
          category.fullName.toLowerCase(),
        ]
          .filter(Boolean)
          .join(" "),
      };
    });
  }, [allCategories]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchValue.trim()) return searchableCategories;

    const search = searchValue.toLowerCase();
    return searchableCategories.filter((category) =>
      category.searchTerms.includes(search),
    );
  }, [searchableCategories, searchValue]);

  // Group categories by parent for better organization
  const groupedCategories = useMemo(() => {
    const groups: Record<string, typeof filteredCategories> = {};

    filteredCategories.forEach((category) => {
      const groupKey = category.mainCategory || "Other";
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(category);
    });

    return groups;
  }, [filteredCategories]);

  const currentCategory = searchableCategories.find(
    (cat) => cat.id === currentCategoryId,
  );
  const currentDisplayName =
    currentCategory?.displayName || currentCategoryName;
  const CurrentIcon =
    currentCategory?.icon || getCategoryIcon(currentCategoryName);

  const handleSelect = (category: any) => {
    // For your existing transactions, pass the display name (subcategory)
    // rather than the full "Main - Sub" format since your transactions use simple category names
    const categoryName = category.subcategory || category.mainCategory;
    onCategoryChange(category.id, categoryName);
    setOpen(false);
    setSearchValue("");
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
            className,
          )}
          disabled={disabled}
          data-testid="category-selector-trigger"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <CurrentIcon className="w-3 h-3 text-muted-foreground" />
            </div>
            <span className="truncate">{currentDisplayName}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        align="start"
        collisionPadding={16}
      >
        <Command>
          <CommandInput
            placeholder="Search categories..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <ScrollArea
            className="max-h-[50vh] sm:h-64"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <CommandList>
              <CommandEmpty>No categories found.</CommandEmpty>

              {Object.entries(groupedCategories).map(
                ([groupName, groupCategories]) => (
                  <CommandGroup key={groupName} heading={groupName}>
                    {groupCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <CommandItem
                          key={category.id}
                          value={category.searchTerms}
                          onSelect={() => handleSelect(category)}
                          className="cursor-pointer"
                          data-testid={`category-option-${category.id}`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                              <Icon className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <span className="flex-1">{category.displayName}</span>
                            
                          </div>
            <Check
              className={cn(
                "ml-2 h-4 w-4",
                currentCategoryId === category.id
                  ? "opacity-100"
                  : "opacity-0",
              )}
            />
            </CommandItem>
            );
            })}
            </CommandGroup>
            ),
            )}
            </CommandList>
            </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
