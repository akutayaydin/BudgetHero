import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, PieChart, BarChart3, TrendingUp, AlertTriangle, Target, Tag, DollarSign, PiggyBank, TrendingDown, Check, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { Budget } from "@shared/schema";


const currency = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function BudgetsPage() {
  const [newBudget, setNewBudget] = useState({ name: "", limit: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSpent, setEditingSpent] = useState<{ [id: string]: string }>({});
  const [editingBudget, setEditingBudget] = useState<{ [id: string]: { name: string; limit: string } }>({});
  const [editMode, setEditMode] = useState<{ [id: string]: 'spent' | 'budget' }>({});
  const [activeTab, setActiveTab] = useState("overview");

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["/api/budgets"],
  });

  // Calculate summary statistics
  const budgetSummary = (budgets as Budget[]).reduce((acc, budget) => {
    const spent = parseFloat(budget.spent);
    const limit = parseFloat(budget.limit);
    acc.totalBudget += limit;
    acc.totalSpent += spent;
    if (spent > limit) {
      acc.overBudgetCount += 1;
      acc.overBudgetAmount += (spent - limit);
    }
    return acc;
  }, {
    totalBudget: 0,
    totalSpent: 0,
    overBudgetCount: 0,
    overBudgetAmount: 0,
    totalRemaining: 0
  });

  budgetSummary.totalRemaining = budgetSummary.totalBudget - budgetSummary.totalSpent;

  // Prepare chart data
  const pieChartData = [
    { name: 'Spent', value: budgetSummary.totalSpent, color: '#ef4444' },
    { name: 'Remaining', value: Math.max(0, budgetSummary.totalRemaining), color: '#22c55e' },
    { name: 'Over Budget', value: budgetSummary.overBudgetAmount, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  const barChartData = (budgets as Budget[]).map(budget => ({
    name: budget.name,
    spent: parseFloat(budget.spent),
    budget: parseFloat(budget.limit),
    remaining: Math.max(0, parseFloat(budget.limit) - parseFloat(budget.spent))
  }));

  const CHART_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];

  const createBudgetMutation = useMutation({
    mutationFn: async (budget: { name: string; limit: string }) => {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budget),
      });
      if (!response.ok) throw new Error("Failed to create budget");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setNewBudget({ name: "", limit: "" });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; spent?: string; name?: string; limit?: string }) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update budget");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setEditingId(null);
      setEditingSpent({});
      setEditingBudget({});
      setEditMode({});
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete budget");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    },
  });

  const handleAddBudget = () => {
    const limit = parseFloat(newBudget.limit);
    if (!newBudget.name || isNaN(limit) || limit <= 0) return;
    
    createBudgetMutation.mutate({
      name: newBudget.name,
      limit: limit.toString(),
    });
  };

  const handleUpdateSpent = (id: string) => {
    const spentValue = editingSpent[id];
    if (!spentValue) return;
    
    const spent = parseFloat(spentValue);
    if (isNaN(spent) || spent < 0) return;
    
    updateBudgetMutation.mutate({
      id,
      spent: spent.toString(),
    });
  };

  const handleUpdateBudget = (id: string) => {
    const budgetData = editingBudget[id];
    if (!budgetData || !budgetData.name || !budgetData.limit) return;
    
    const limit = parseFloat(budgetData.limit);
    if (isNaN(limit) || limit <= 0) return;
    
    updateBudgetMutation.mutate({
      id,
      name: budgetData.name,
      limit: limit.toString(),
    });
  };

  const startEditingBudget = (budget: Budget) => {
    setEditingId(budget.id);
    setEditMode({ ...editMode, [budget.id]: 'budget' });
    setEditingBudget({
      ...editingBudget,
      [budget.id]: {
        name: budget.name,
        limit: budget.limit
      }
    });
  };

  const startEditingSpent = (budget: Budget) => {
    setEditingId(budget.id);
    setEditMode({ ...editMode, [budget.id]: 'spent' });
    setEditingSpent({
      ...editingSpent,
      [budget.id]: budget.spent
    });
  };

  const cancelEditing = (id: string) => {
    setEditingId(null);
    setEditingSpent({});
    setEditingBudget({});
    setEditMode({});
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-2 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const BudgetOverviewCards = () => (
    <div className="grid gap-6 md:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currency(budgetSummary.totalBudget)}</div>
          <p className="text-xs text-muted-foreground">
            Across {(budgets as Budget[]).length} categories
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currency(budgetSummary.totalSpent)}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((budgetSummary.totalSpent / budgetSummary.totalBudget) * 100)}% of total budget
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${budgetSummary.totalRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {currency(budgetSummary.totalRemaining)}
          </div>
          <p className="text-xs text-muted-foreground">
            {budgetSummary.totalRemaining < 0 ? 'Over budget' : 'Available to spend'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{budgetSummary.overBudgetCount}</div>
          <p className="text-xs text-muted-foreground">
            {budgetSummary.overBudgetAmount > 0 && `${currency(budgetSummary.overBudgetAmount)} over`}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

      <BudgetOverviewCards />

      {/* Show prominent call-to-action if no budgets exist */}
      {(budgets as Budget[]).length === 0 && (
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white mb-6 cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]"
          onClick={() => setActiveTab("manage")}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Create Your First Budget</h2>
              <p className="text-blue-100">Take control of your spending by setting monthly limits</p>
              <p className="text-blue-200 text-sm mt-1">👆 Click here to get started</p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center justify-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center justify-center gap-2">
            <PieChart className="h-4 w-4" />
            <span>Charts</span>
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Budget</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Spending Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => currency(Number(value))} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Utilization by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(budgets as Budget[]).map((budget, index) => {
                    const spent = parseFloat(budget.spent);
                    const limit = parseFloat(budget.limit);
                    const percentage = Math.min(100, (spent / limit) * 100);
                    const isOverBudget = spent > limit;

                    return (
                      <div key={budget.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{budget.name}</span>
                          <span className={isOverBudget ? 'text-red-600' : ''}>
                            {currency(spent)} / {currency(limit)}
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-2"
                          style={{
                            '--progress-background': isOverBudget ? '#fef2f2' : undefined,
                            '--progress-foreground': isOverBudget ? '#ef4444' : undefined,
                          } as any}
                        />
                        <div className="text-xs text-muted-foreground">
                          {Math.round(percentage)}% used
                          {isOverBudget && ` (${currency(spent - limit)} over)`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Spending Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => currency(Number(value))} />
                    <Legend />
                    <Bar dataKey="budget" fill="#3b82f6" name="Budget Limit" />
                    <Bar dataKey="spent" fill="#ef4444" name="Amount Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">

          {/* Create new budget form */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <PiggyBank className="h-5 w-5 text-blue-600" />
                Set Up a Spending Category
              </CardTitle>
              <p className="text-sm text-blue-700">
                Examples: Groceries ($400/month), Entertainment ($200/month), Gas ($150/month)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-600" />
                      What do you want to budget for?
                    </label>
                    <Input
                      placeholder="Type category name: Groceries, Restaurants, Shopping..."
                      value={newBudget.name}
                      onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                      className="text-lg py-3"
                    />
                    <p className="text-xs text-gray-500 mt-1">Popular: Groceries, Gas, Entertainment, Dining Out</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      How much per month?
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                      <Input
                        placeholder="400"
                        type="number"
                        value={newBudget.limit}
                        onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                        className="text-lg py-3 pl-8"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Tip: Start with your usual monthly spending for this category</p>
                  </div>
                </div>
                <Button 
                  onClick={handleAddBudget}
                  disabled={createBudgetMutation.isPending}
                  className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-6"
                >
                  {createBudgetMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create My Budget
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Budgets or Getting Started Guide */}
          {(budgets as Budget[]).length === 0 ? (
            <div className="space-y-6">
              {/* Step-by-step guide */}
              <Card className="border-dashed border-2 border-green-300 bg-green-50">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-900 mb-2">Ready to Start Budgeting?</h3>
                    <p className="text-green-700">Follow these simple steps to take control of your finances</p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
                      <h4 className="font-semibold text-gray-900 mb-1">Choose a Category</h4>
                      <p className="text-sm text-gray-600">Pick what you want to budget for (like "Groceries" or "Entertainment")</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
                      <h4 className="font-semibold text-gray-900 mb-1">Set Your Limit</h4>
                      <p className="text-sm text-gray-600">Enter how much you want to spend per month (like $400)</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
                      <h4 className="font-semibold text-gray-900 mb-1">Track Progress</h4>
                      <p className="text-sm text-gray-600">Watch your spending and stay within your budget</p>
                    </div>
                  </div>
                  
                  <div className="text-center mt-6">
                    <p className="text-green-700 font-medium">👆 Fill out the form above to get started!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Budget Categories</h3>
                <p className="text-sm text-gray-500">Click any budget to edit it</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(budgets as Budget[]).map((budget: Budget) => {
                const spent = parseFloat(budget.spent);
                const limit = parseFloat(budget.limit);
                const percentage = Math.min(100, (spent / limit) * 100);
                const isOverBudget = spent > limit;
                const remaining = limit - spent;

                return (
                  <Card key={budget.id} className={isOverBudget ? "border-destructive" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{budget.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingBudget(budget)}
                            title="Edit budget name and spending limit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBudgetMutation.mutate(budget.id)}
                            disabled={deleteBudgetMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {isOverBudget && (
                        <Badge variant="destructive" className="w-fit">
                          Over Budget
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Spent</span>
                          <span className={isOverBudget ? "text-destructive font-medium" : ""}>
                            {currency(spent)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Budget</span>
                          <span>{currency(limit)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Remaining</span>
                          <span className={remaining < 0 ? "text-destructive" : "text-emerald-600"}>
                            {currency(remaining)}
                          </span>
                        </div>
                      </div>

                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />

                      <div className="text-center text-sm text-muted-foreground">
                        {Math.round(percentage)}% used
                      </div>

                      {/* Edit budget or spent amount */}
                      {editingId === budget.id ? (
                        editMode[budget.id] === 'budget' ? (
                          // Edit budget name and limit
                          <div className="space-y-2">
                            <Input
                              placeholder="Budget name"
                              value={editingBudget[budget.id]?.name || ''}
                              onChange={(e) => setEditingBudget({
                                ...editingBudget,
                                [budget.id]: {
                                  ...editingBudget[budget.id],
                                  name: e.target.value
                                }
                              })}
                            />
                            <Input
                              placeholder="Budget limit"
                              type="number"
                              value={editingBudget[budget.id]?.limit || ''}
                              onChange={(e) => setEditingBudget({
                                ...editingBudget,
                                [budget.id]: {
                                  ...editingBudget[budget.id],
                                  limit: e.target.value
                                }
                              })}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateBudget(budget.id)}
                                disabled={updateBudgetMutation.isPending}
                                className="flex-1"
                              >
                                {updateBudgetMutation.isPending ? "Saving..." : "Save Budget"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelEditing(budget.id)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Edit spent amount
                          <div className="flex gap-2">
                            <Input
                              placeholder="Update spent amount"
                              type="number"
                              value={editingSpent[budget.id] || spent.toString()}
                              onChange={(e) => setEditingSpent({ 
                                ...editingSpent, 
                                [budget.id]: e.target.value 
                              })}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdateSpent(budget.id)}
                              disabled={updateBudgetMutation.isPending}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelEditing(budget.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        )
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => startEditingSpent(budget)}
                          >
                            Update Amount Spent
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => startEditingBudget(budget)}
                          >
                            Edit Name & Limit
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}