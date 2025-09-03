import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Trash2, DollarSign } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Goal } from "@shared/schema";

const currency = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function GoalsPage() {
  const [newGoal, setNewGoal] = useState({ name: "", target: "" });
  const [contributions, setContributions] = useState<{ [id: string]: string }>({});

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["/api/goals"],
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goal: { name: string; target: string }) => {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goal),
      });
      if (!response.ok) throw new Error("Failed to create goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setNewGoal({ name: "", target: "" });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, saved }: { id: string; saved: string }) => {
      const response = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved }),
      });
      if (!response.ok) throw new Error("Failed to update goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setContributions({});
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/goals/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete goal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const handleAddGoal = () => {
    const target = parseFloat(newGoal.target);
    if (!newGoal.name || isNaN(target) || target <= 0) return;
    
    createGoalMutation.mutate({
      name: newGoal.name,
      target: target.toString(),
    });
  };

  const handleContribute = (goal: Goal) => {
    const contribution = parseFloat(contributions[goal.id] || "0");
    if (isNaN(contribution) || contribution <= 0) return;
    
    const currentSaved = parseFloat(goal.saved);
    const newSaved = currentSaved + contribution;
    
    updateGoalMutation.mutate({
      id: goal.id,
      saved: newSaved.toString(),
    });
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

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 md:pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
        <p className="text-muted-foreground">
          Set and track your financial savings goals
        </p>
      </div>

      {/* Create new goal */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Goal name (e.g., Emergency Fund, Vacation, New Car)"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              className="flex-1"
            />
            <Input
              placeholder="Target amount ($)"
              type="number"
              value={newGoal.target}
              onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
              className="w-40"
            />
            <Button 
              onClick={handleAddGoal}
              disabled={createGoalMutation.isPending}
            >
              {createGoalMutation.isPending ? "Adding..." : "Add Goal"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Goals list */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No savings goals yet. Create your first goal to start saving towards something special.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(goals as Goal[]).map((goal: Goal) => {
            const saved = parseFloat(goal.saved);
            const target = parseFloat(goal.target);
            const percentage = Math.min(100, (saved / target) * 100);
            const remaining = target - saved;
            const isCompleted = saved >= target;

            return (
              <Card key={goal.id} className={isCompleted ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {goal.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGoalMutation.mutate(goal.id)}
                      disabled={deleteGoalMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {isCompleted && (
                    <Badge className="w-fit bg-emerald-600">
                      🎉 Goal Achieved!
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Saved</span>
                      <span className="font-medium text-emerald-600">
                        {currency(saved)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Target</span>
                      <span>{currency(target)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Remaining</span>
                      <span className={isCompleted ? "text-emerald-600" : "text-muted-foreground"}>
                        {isCompleted ? "Completed!" : currency(remaining)}
                      </span>
                    </div>
                  </div>

                  <Progress 
                    value={percentage} 
                    className="h-3"
                  />

                  <div className="text-center text-sm text-muted-foreground">
                    {Math.round(percentage)}% complete
                  </div>

                  {/* Add contribution */}
                  {!isCompleted && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add contribution ($)"
                          type="number"
                          value={contributions[goal.id] || ""}
                          onChange={(e) => setContributions({ 
                            ...contributions, 
                            [goal.id]: e.target.value 
                          })}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleContribute(goal)}
                          disabled={updateGoalMutation.isPending || !contributions[goal.id]}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Quick contribution buttons */}
                  {!isCompleted && (
                    <div className="flex gap-2">
                      {[25, 50, 100].map(amount => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setContributions({ 
                            ...contributions, 
                            [goal.id]: amount.toString() 
                          })}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}