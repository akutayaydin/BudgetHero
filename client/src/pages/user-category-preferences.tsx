import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Save, X, Tag, Store, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCategoryDisplay } from "@/lib/category-display";

interface UserMerchantOverride {
  id: string;
  merchantName: string;
  adminCategoryId: string;
  subcategoryName?: string;
  createdAt: string;
  adminCategory: {
    id: string;
    name: string;
    parentId?: string;
    color: string;
  };
}

interface AdminCategory {
  id: string;
  name: string;
  parentId?: string;
  color: string;
  sortOrder: number;
}

export default function UserCategoryPreferences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOverride, setNewOverride] = useState({ 
    merchantName: "", 
    adminCategoryId: "", 
    subcategoryName: "" 
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Get user's merchant overrides
  const { data: merchantOverrides = [], isLoading: overridesLoading } = useQuery<UserMerchantOverride[]>({
    queryKey: ["/api/user/merchant-overrides"],
  });

  // Get admin categories
  const { data: adminCategories = [] } = useQuery<AdminCategory[]>({
    queryKey: ["/api/admin/categories"],
  });

  const createOverrideMutation = useMutation({
    mutationFn: async (override: { merchantName: string; adminCategoryId: string; subcategoryName?: string }) => {
      const response = await fetch("/api/user/merchant-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(override),
      });
      if (!response.ok) throw new Error("Failed to create merchant override");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/merchant-overrides"] });
      setShowCreateDialog(false);
      setNewOverride({ merchantName: "", adminCategoryId: "", subcategoryName: "" });
      toast({ title: "Success", description: "Merchant preference created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create merchant preference", variant: "destructive" });
    },
  });

  const updateOverrideMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<UserMerchantOverride>) => {
      const response = await fetch(`/api/user/merchant-overrides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update merchant override");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/merchant-overrides"] });
      setEditingId(null);
      toast({ title: "Success", description: "Merchant preference updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update merchant preference", variant: "destructive" });
    },
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/user/merchant-overrides/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete merchant override");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/merchant-overrides"] });
      toast({ title: "Success", description: "Merchant preference deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete merchant preference", variant: "destructive" });
    },
  });

  const parentCategories = adminCategories.filter(cat => !cat.parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  const getCategoryDisplay = (override: UserMerchantOverride) => {
    const category = override.adminCategory;
    let display = category.name;
    
    if (category.parentId) {
      const parent = adminCategories.find(c => c.id === category.parentId);
      if (parent) {
        display = `${parent.name} > ${category.name}`;
      }
    }
    
    if (override.subcategoryName) {
      display += ` > ${override.subcategoryName}`;
    }
    
    return display;
  };

  const groupedOverrides = merchantOverrides.reduce((acc, override) => {
    const categoryDisplay = getCategoryDisplay(override);
    if (!acc[categoryDisplay]) {
      acc[categoryDisplay] = [];
    }
    acc[categoryDisplay].push(override);
    return acc;
  }, {} as Record<string, UserMerchantOverride[]>);

  if (overridesLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 md:pt-6">
        <div className="text-center">Loading your category preferences...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 md:pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Category Preferences</h1>
          <p className="text-gray-600">Manage your personal merchant categorization preferences and subcategories</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Preference
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Merchant Preference</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Merchant name (e.g., Starbucks, Shell, Amazon)"
                value={newOverride.merchantName}
                onChange={(e) => setNewOverride({ ...newOverride, merchantName: e.target.value })}
              />
              <Select 
                value={newOverride.adminCategoryId} 
                onValueChange={(value) => setNewOverride({ ...newOverride, adminCategoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Subcategory (optional, e.g., Coffee shops, Gas stations)"
                value={newOverride.subcategoryName}
                onChange={(e) => setNewOverride({ ...newOverride, subcategoryName: e.target.value })}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button 
                  onClick={() => createOverrideMutation.mutate(newOverride)}
                  disabled={!newOverride.merchantName.trim() || !newOverride.adminCategoryId || createOverrideMutation.isPending}
                >
                  {createOverrideMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Preferences</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merchantOverrides.length}</div>
            <p className="text-xs text-muted-foreground">Custom merchant rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories Used</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(groupedOverrides).length}</div>
            <p className="text-xs text-muted-foreground">Different categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Subcategories</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {merchantOverrides.filter(o => o.subcategoryName).length}
            </div>
            <p className="text-xs text-muted-foreground">Custom subcategories</p>
          </CardContent>
        </Card>
      </div>

      {/* Merchant Preferences grouped by category */}
      <div className="space-y-6">
        {Object.keys(groupedOverrides).length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Custom Preferences Yet</h3>
                <p className="text-gray-600 mb-4">
                  Create merchant preferences to customize how specific stores and services are categorized.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Preference
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedOverrides).map(([categoryDisplay, overrides]) => (
            <Card key={categoryDisplay}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  {categoryDisplay}
                  <Badge variant="secondary">{overrides.length} merchants</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {overrides.map((override) => (
                    <div key={override.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: override.adminCategory.color }}
                        />
                        <div>
                          {editingId === override.id ? (
                            <div className="space-y-2">
                              <Input
                                defaultValue={override.merchantName}
                                placeholder="Merchant name"
                                onBlur={(e) => {
                                  if (e.target.value !== override.merchantName) {
                                    updateOverrideMutation.mutate({ 
                                      id: override.id, 
                                      merchantName: e.target.value 
                                    });
                                  } else {
                                    setEditingId(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateOverrideMutation.mutate({ 
                                      id: override.id, 
                                      merchantName: e.currentTarget.value 
                                    });
                                  } else if (e.key === 'Escape') {
                                    setEditingId(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Input
                                defaultValue={override.subcategoryName || ""}
                                placeholder="Subcategory (optional)"
                                onBlur={(e) => {
                                  updateOverrideMutation.mutate({ 
                                    id: override.id, 
                                    subcategoryName: e.target.value || undefined 
                                  });
                                  setEditingId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateOverrideMutation.mutate({ 
                                      id: override.id, 
                                      subcategoryName: e.currentTarget.value || undefined 
                                    });
                                    setEditingId(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingId(null);
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">{override.merchantName}</p>
                              {override.subcategoryName && (
                                <p className="text-sm text-gray-600">→ {override.subcategoryName}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(override.id)}
                          disabled={editingId === override.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteOverrideMutation.mutate(override.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>How Category Preferences Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Merchant Preferences:</strong> When you set a preference for a merchant (like "Starbucks" → "Food & Dining &gt; Coffee shops"), 
              all future transactions from that merchant will automatically use your preference.
            </p>
            <p>
              <strong>Subcategories:</strong> You can add custom subcategories to organize your spending further. 
              For example, "Food & Dining &gt; Coffee shops" or "Transport &gt; Ride sharing".
            </p>
            <p>
              <strong>Priority:</strong> Your personal preferences always override the system's automatic categorization, 
              ensuring your transactions are organized exactly how you want them.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}