/**
 * Utility functions for displaying categories in "Parent > Sub-category" format
 */

interface CategoryWithParent {
  id: string;
  name: string;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
  };
}

/**
 * Formats a category for display as "Parent > Sub-category" or just "Parent" if no subcategory
 */
export function formatCategoryDisplay(category: CategoryWithParent): string {
  if (category.parent) {
    return `${category.parent.name} > ${category.name}`;
  }
  return category.name;
}

/**
 * Formats a category display from separate parent and child names
 */
export function formatCategoryFromNames(parentName?: string, childName?: string): string {
  if (parentName && childName) {
    return `${parentName} > ${childName}`;
  }
  return parentName || childName || 'Uncategorized';
}

/**
 * Gets the display name for a category given its ID and a list of all categories
 */
export function getCategoryDisplayName(categoryId: string, allCategories: CategoryWithParent[]): string {
  const category = allCategories.find(c => c.id === categoryId);
  if (!category) return 'Unknown Category';
  
  if (category.parentId) {
    const parent = allCategories.find(c => c.id === category.parentId);
    if (parent) {
      return `${parent.name} > ${category.name}`;
    }
  }
  
  return category.name;
}

/**
 * Groups categories by parent for display purposes
 */
export function groupCategoriesByParent(categories: CategoryWithParent[]) {
  const parents = categories.filter(c => !c.parentId);
  const children = categories.filter(c => c.parentId);
  
  return parents.map(parent => ({
    ...parent,
    subcategories: children.filter(c => c.parentId === parent.id)
  }));
}

/**
 * Creates a flat list of categories with display names for dropdowns/selects
 */
export function createCategoryOptions(categories: CategoryWithParent[]) {
  return categories.map(category => ({
    id: category.id,
    name: category.name,
    displayName: formatCategoryDisplay(category),
    isParent: !category.parentId,
    parentId: category.parentId
  })).sort((a, b) => {
    // Sort parents first, then subcategories under each parent
    if (a.isParent && !b.isParent) return -1;
    if (!a.isParent && b.isParent) return 1;
    if (!a.isParent && !b.isParent && a.parentId !== b.parentId) {
      const parentA = categories.find(c => c.id === a.parentId)?.name || '';
      const parentB = categories.find(c => c.id === b.parentId)?.name || '';
      return parentA.localeCompare(parentB);
    }
    return a.displayName.localeCompare(b.displayName);
  });
}