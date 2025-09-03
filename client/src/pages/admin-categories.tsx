import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Save, X, Settings, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminCategory {
  id: string;
  name: string;
  parentId?: string;
  description?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "", parentId: "", color: "#3B82F6", ledgerType: "EXPENSE" });
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: categories = [], isLoading } = useQuery<AdminCategory[]>({
    queryKey: ["/api/admin/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (category: { name: string; description?: string; parentId?: string; color?: string; ledgerType: string }) => {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });
      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      setShowCreateDialog(false);
      setNewCategory({ name: "", description: "", parentId: "", color: "#3B82F6", ledgerType: "EXPENSE" });
      toast({ title: "Success", description: "Category created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<AdminCategory>) => {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      setEditingId(null);
      toast({ title: "Success", description: "Category updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "Success", description: "Category deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    },
  });

  const parentCategories = categories.filter(cat => !cat.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const getSubCategories = (parentId: string) => categories.filter(cat => cat.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  
  const getCategoryDisplay = (category: AdminCategory) => {
    if (category.parentId) {
      const parent = categories.find(c => c.id === category.parentId);
      return parent ? `${parent.name} > ${category.name}` : category.name;
    }
    return category.name;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">Category Management</h1>
            <p className="text-sm text-muted-foreground">Manage transaction categories and subcategories</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Loading categories...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 md:pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Category Management</h1>
          <p className="text-muted-foreground">Manage transaction categories and subcategories for all users</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Category name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
              <Input
                placeholder="Description (optional)"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
              <Select value={newCategory.ledgerType} onValueChange={(value) => setNewCategory({ ...newCategory, ledgerType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ledger type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="DEBT_PRINCIPAL">Debt Principal</SelectItem>
                  <SelectItem value="DEBT_INTEREST">Debt Interest</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newCategory.parentId || "none"} onValueChange={(value) => setNewCategory({ ...newCategory, parentId: value === "none" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (main category)</SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-12 h-8 border rounded"
                />
                <span className="text-sm text-muted-foreground">Category color</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button 
                  onClick={() => createMutation.mutate(newCategory)}
                  disabled={!newCategory.name.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {/* Parent Categories */}
        {parentCategories.map((parentCategory) => (
          <Card key={parentCategory.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: parentCategory.color }}
                  />
                  {editingId === parentCategory.id ? (
                    <Input
                      defaultValue={parentCategory.name}
                      onBlur={(e) => {
                        if (e.target.value !== parentCategory.name) {
                          updateMutation.mutate({ id: parentCategory.id, name: e.target.value });
                        } else {
                          setEditingId(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateMutation.mutate({ id: parentCategory.id, name: e.currentTarget.value });
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                        }
                      }}
                      className="font-semibold"
                      autoFocus
                    />
                  ) : (
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      {parentCategory.name}
                      <Badge variant="secondary">{getSubCategories(parentCategory.id).length} subcategories</Badge>
                    </CardTitle>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={parentCategory.isActive ? "default" : "secondary"}>
                    {parentCategory.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(parentCategory.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(parentCategory.id)}
                    disabled={getSubCategories(parentCategory.id).length > 0}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {getSubCategories(parentCategory.id).length > 0 && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getSubCategories(parentCategory.id).map((subCategory) => (
                    <div key={subCategory.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subCategory.color || parentCategory.color }}
                        />
                        {editingId === subCategory.id ? (
                          <Input
                            defaultValue={subCategory.name}
                            onBlur={(e) => {
                              if (e.target.value !== subCategory.name) {
                                updateMutation.mutate({ id: subCategory.id, name: e.target.value });
                              } else {
                                setEditingId(null);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateMutation.mutate({ id: subCategory.id, name: e.currentTarget.value });
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                              }
                            }}
                            className="text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium">{subCategory.name}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(subCategory.id)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(subCategory.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Category Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{parentCategories.length}</div>
                <div className="text-sm text-muted-foreground">Main Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {categories.filter(c => c.parentId).length}
                </div>
                <div className="text-sm text-muted-foreground">Subcategories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {categories.filter(c => c.isActive).length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {categories.filter(c => !c.isActive).length}
                </div>
                <div className="text-sm text-muted-foreground">Inactive</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}