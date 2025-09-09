import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import tagIllustration from "@assets/assets/images/tagIllustration.svg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Settings,
  Tag,
  Split,
  Eye,
  Edit3,
  Trash2,
  Play,
  Pause,
  Search,
  Wand2,
  FileText,
  Hash,
  EyeOff,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import type {
  TransactionTag,
  AutomationRule,
  TransactionSplit,
  AdminCategory,
  Transaction,
} from "@shared/schema";

// Tag Management Component
function TagManagement() {
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TransactionTag | null>(null);
  const [tagForm, setTagForm] = useState({
    name: "",
    color: "#6366f1",
    description: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tags = [] } = useQuery<TransactionTag[]>({
    queryKey: ["/api/transaction-tags"],
  });

  const createTagMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/transaction-tags", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transaction-tags"] });
      setIsCreateTagOpen(false);
      setTagForm({ name: "", color: "#6366f1", description: "" });
      toast({ title: "Tag created successfully" });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/transaction-tags/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transaction-tags"] });
      setEditingTag(null);
      toast({ title: "Tag updated successfully" });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/transaction-tags/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transaction-tags"] });
      toast({ title: "Tag deleted successfully" });
    },
  });

  const handleCreateTag = () => {
    createTagMutation.mutate(tagForm);
  };

  const handleUpdateTag = () => {
    if (editingTag) {
      updateTagMutation.mutate({ id: editingTag.id, data: tagForm });
    }
  };

  const handleEditTag = (tag: TransactionTag) => {
    setEditingTag(tag);
    setTagForm({
      name: tag.name,
      color: tag.color,
      description: tag.description || "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Transaction Tags
          </CardTitle>
          <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-create-tag">
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tag-name">Tag Name</Label>
                  <Input
                    id="tag-name"
                    data-testid="input-tag-name"
                    value={tagForm.name}
                    onChange={(e) =>
                      setTagForm({ ...tagForm, name: e.target.value })
                    }
                    placeholder="e.g., work expense, vacation, family"
                  />
                </div>
                <div>
                  <Label htmlFor="tag-color">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="tag-color"
                      type="color"
                      data-testid="input-tag-color"
                      value={tagForm.color}
                      onChange={(e) =>
                        setTagForm({ ...tagForm, color: e.target.value })
                      }
                      className="w-16 h-10"
                    />
                    <Badge
                      style={{ backgroundColor: tagForm.color, color: "white" }}
                    >
                      {tagForm.name || "Preview"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label htmlFor="tag-description">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="tag-description"
                    data-testid="input-tag-description"
                    value={tagForm.description}
                    onChange={(e) =>
                      setTagForm({ ...tagForm, description: e.target.value })
                    }
                    placeholder="Describe what this tag is used for..."
                  />
                </div>
                <Button
                  onClick={handleCreateTag}
                  disabled={!tagForm.name || createTagMutation.isPending}
                  data-testid="button-save-tag"
                >
                  Create Tag
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Intro section with image + description */}
        <div className="mb-8 flex flex-col md:flex-row items-center gap-6">
          <img
            src={tagIllustration}
            alt="Transaction tags illustration"
            className="w-36 h-36 md:w-48 md:h-48 object-contain rounded-xl"
          />
          <p className="text-sm md:text-base text-gray-700 max-w-xl">
            Create custom tags to group transactions from different categories —
            track your spending on vacations, renovations, or personal projects.
            Manage your finances with clarity and style.
          </p>
        </div>
        {/* Tags grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl shadow hover:shadow-lg transition-shadow duration-300 bg-white"
            >
              <div className="flex items-center gap-3 flex-1">
                <Badge
                  style={{ backgroundColor: tag.color, color: "white" }}
                  className="px-3 py-1 rounded-full text-sm font-medium transition-transform transform hover:scale-105"
                  data-testid={`tag-${tag.id}`}
                >
                  {tag.name}
                </Badge>
                {tag.description && (
                  <span className="text-sm text-gray-500">
                    {tag.description}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditTag(tag)}
                  className="hover:bg-gray-100 transition-colors"
                  data-testid={`button-edit-tag-${tag.id}`}
                >
                  <Edit3 className="h-4 w-4 text-gray-600" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteTagMutation.mutate(tag.id)}
                  disabled={deleteTagMutation.isPending}
                  className="hover:bg-red-100 transition-colors"
                  data-testid={`button-delete-tag-${tag.id}`}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Automation Rules Component
function AutomationRules() {
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    description: "",
    merchantPattern: "",
    descriptionPattern: "",
    amountMin: "",
    amountMax: "",
    transactionType: "both",
    setCategoryId: "none",
    addTagIds: [] as string[],
    renameTransactionTo: "",
    ignoreTransaction: false,
    ignoreForBudgeting: false,
    ignoreForReporting: false,
    enableCategoryChange: false,
    enableRename: false,
    enableTagging: false,
    enableIgnore: false,
    priority: 0,
  });
  const [previewResults, setPreviewResults] = useState<Transaction[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery<AutomationRule[]>({
    queryKey: ["/api/automation-rules"],
  });

  const { data: categories = [] } = useQuery<AdminCategory[]>({
    queryKey: ["/api/admin/categories"],
  });

  const { data: tags = [] } = useQuery<TransactionTag[]>({
    queryKey: ["/api/transaction-tags"],
  });

  // Add query for recurring override rules
  const { data: recurringOverrides = [] } = useQuery({
    queryKey: ["/api/user/recurring-overrides"],
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/automation-rules", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setIsCreateRuleOpen(false);
      resetForm();
      toast({ title: "Automation rule created and applied successfully" });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/automation-rules/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setEditingRule(null);
      toast({ title: "Automation rule updated and applied successfully" });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/automation-rules/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-rules"] });
      toast({ title: "Automation rule deleted successfully" });
    },
  });

  const applyRulesMutation = useMutation({
    mutationFn: () => apiRequest("/api/automation-rules/apply", "POST", {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Automation rules applied successfully",
        description: `Processed ${data.processedCount} transactions with ${data.applicationsCount} rule applications`,
      });
    },
  });

  const resetForm = () => {
    setRuleForm({
      name: "",
      description: "",
      merchantPattern: "",
      descriptionPattern: "",
      amountMin: "",
      amountMax: "",
      transactionType: "both",
      setCategoryId: "none",
      addTagIds: [],
      renameTransactionTo: "",
      ignoreTransaction: false,
      ignoreForBudgeting: false,
      ignoreForReporting: false,
      enableCategoryChange: false,
      enableRename: false,
      enableTagging: false,
      enableIgnore: false,
      priority: 0,
    });
    setPreviewResults([]);
    setShowPreview(false);
  };

  // Preview function to show matching transactions
  const handlePreviewRule = async () => {
    const transactions = await fetch("/api/transactions").then((res) =>
      res.json(),
    );

    const matchingTransactions = transactions.filter(
      (transaction: Transaction) => {
        // Apply the same matching logic as the backend
        let matches = false;

        if (ruleForm.merchantPattern) {
          const pattern = new RegExp(ruleForm.merchantPattern, "i");
          matches =
            matches ||
            pattern.test(transaction.merchant || "") ||
            pattern.test(transaction.description);
        }

        if (ruleForm.descriptionPattern) {
          const pattern = new RegExp(ruleForm.descriptionPattern, "i");
          matches = matches || pattern.test(transaction.description);
        }

        if (ruleForm.amountMin || ruleForm.amountMax) {
          const amount = parseFloat(transaction.amount.toString());
          const minAmount = ruleForm.amountMin
            ? parseFloat(ruleForm.amountMin)
            : 0;
          const maxAmount = ruleForm.amountMax
            ? parseFloat(ruleForm.amountMax)
            : Infinity;
          matches = matches || (amount >= minAmount && amount <= maxAmount);
        }

        if (ruleForm.transactionType !== "both") {
          matches = matches && transaction.type === ruleForm.transactionType;
        }

        return matches;
      },
    );

    setPreviewResults(matchingTransactions.slice(0, 10)); // Limit to 10 for UI
    setShowPreview(true);
  };

  const handleCreateRule = () => {
    const data = {
      ...ruleForm,
      amountMin: ruleForm.amountMin ? parseFloat(ruleForm.amountMin) : null,
      amountMax: ruleForm.amountMax ? parseFloat(ruleForm.amountMax) : null,
      setCategoryId:
        ruleForm.setCategoryId === "none" ? null : ruleForm.setCategoryId,
    };
    createRuleMutation.mutate(data);
  };

  const handleUpdateRule = () => {
    if (editingRule) {
      const data = {
        ...ruleForm,
        amountMin: ruleForm.amountMin ? parseFloat(ruleForm.amountMin) : null,
        amountMax: ruleForm.amountMax ? parseFloat(ruleForm.amountMax) : null,
        setCategoryId:
          ruleForm.setCategoryId === "none" ? null : ruleForm.setCategoryId,
      };
      updateRuleMutation.mutate({ id: editingRule.id, data });
    }
  };

  const handleEditRule = (rule: AutomationRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description || "",
      merchantPattern: rule.merchantPattern || "",
      descriptionPattern: rule.descriptionPattern || "",
      amountMin: rule.amountMin?.toString() || "",
      amountMax: rule.amountMax?.toString() || "",
      transactionType: rule.transactionType || "both",
      setCategoryId: rule.setCategoryId || "none",
      addTagIds: rule.addTagIds || [],
      renameTransactionTo: (rule as any).renameTransactionTo || "",
      ignoreTransaction: (rule as any).ignoreTransaction || false,
      ignoreForBudgeting: rule.ignoreForBudgeting || false,
      ignoreForReporting: rule.ignoreForReporting || false,
      enableCategoryChange: (rule as any).enableCategoryChange || false,
      enableRename: (rule as any).enableRename || false,
      enableTagging: (rule as any).enableTagging || false,
      enableIgnore: (rule as any).enableIgnore || false,
      priority: rule.priority || 0,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Automation Rules
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyRulesMutation.mutate()}
              disabled={applyRulesMutation.isPending}
              data-testid="button-apply-rules"
            >
              <Play className="h-4 w-4 mr-2" />
              {applyRulesMutation.isPending ? "Applying..." : "Apply to All"}
            </Button>
            <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-create-rule">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-purple-600" />
                    {editingRule ? "Edit" : "Create"} Automation Rule
                    <Badge
                      variant="outline"
                      className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
                    >
                      Smart automation
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input
                        id="rule-name"
                        data-testid="input-rule-name"
                        value={ruleForm.name}
                        onChange={(e) =>
                          setRuleForm({ ...ruleForm, name: e.target.value })
                        }
                        placeholder="e.g., Starbucks Auto-Category"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rule-priority">Priority</Label>
                      <Input
                        id="rule-priority"
                        type="number"
                        data-testid="input-rule-priority"
                        value={ruleForm.priority}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            priority: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="0 (higher numbers = higher priority)"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="rule-description">Description</Label>
                    <Textarea
                      id="rule-description"
                      data-testid="input-rule-description"
                      value={ruleForm.description}
                      onChange={(e) =>
                        setRuleForm({
                          ...ruleForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe what this rule does..."
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">
                      Conditions (if any match, rule applies)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="merchant-pattern">
                          Merchant Pattern
                        </Label>
                        <Input
                          id="merchant-pattern"
                          data-testid="input-merchant-pattern"
                          value={ruleForm.merchantPattern}
                          onChange={(e) =>
                            setRuleForm({
                              ...ruleForm,
                              merchantPattern: e.target.value,
                            })
                          }
                          placeholder="e.g., Starbucks, Amazon"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description-pattern">
                          Description Pattern
                        </Label>
                        <Input
                          id="description-pattern"
                          data-testid="input-description-pattern"
                          value={ruleForm.descriptionPattern}
                          onChange={(e) =>
                            setRuleForm({
                              ...ruleForm,
                              descriptionPattern: e.target.value,
                            })
                          }
                          placeholder="e.g., coffee, gas station"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="amount-min">Min Amount</Label>
                        <Input
                          id="amount-min"
                          type="number"
                          step="0.01"
                          data-testid="input-amount-min"
                          value={ruleForm.amountMin}
                          onChange={(e) =>
                            setRuleForm({
                              ...ruleForm,
                              amountMin: e.target.value,
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="amount-max">Max Amount</Label>
                        <Input
                          id="amount-max"
                          type="number"
                          step="0.01"
                          data-testid="input-amount-max"
                          value={ruleForm.amountMax}
                          onChange={(e) =>
                            setRuleForm({
                              ...ruleForm,
                              amountMax: e.target.value,
                            })
                          }
                          placeholder="100.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="transaction-type">
                          Transaction Type
                        </Label>
                        <Select
                          value={ruleForm.transactionType}
                          onValueChange={(value) =>
                            setRuleForm({ ...ruleForm, transactionType: value })
                          }
                        >
                          <SelectTrigger data-testid="select-transaction-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both">
                              Both Income & Expense
                            </SelectItem>
                            <SelectItem value="income">Income Only</SelectItem>
                            <SelectItem value="expense">
                              Expense Only
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <h4 className="font-semibold text-lg">Smart Actions</h4>
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
                      >
                        Configure what happens when rule matches
                      </Badge>
                    </div>

                    <Accordion type="multiple" className="space-y-4">
                      {/* Change Category Action */}
                      <AccordionItem
                        value="category"
                        className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={ruleForm.enableCategoryChange}
                              onCheckedChange={(checked) =>
                                setRuleForm({
                                  ...ruleForm,
                                  enableCategoryChange: checked,
                                })
                              }
                              data-testid="switch-enable-category"
                            />
                            <Tag className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Change Category</span>
                            {ruleForm.enableCategoryChange &&
                              ruleForm.setCategoryId !== "none" && (
                                <Badge variant="outline" className="ml-2">
                                  {
                                    categories.find(
                                      (c) => c.id === ruleForm.setCategoryId,
                                    )?.name
                                  }
                                </Badge>
                              )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-3">
                            <Label
                              htmlFor="set-category"
                              className="text-sm font-medium"
                            >
                              Select new category for matching transactions
                            </Label>
                            <Select
                              value={ruleForm.setCategoryId}
                              onValueChange={(value) =>
                                setRuleForm({
                                  ...ruleForm,
                                  setCategoryId: value,
                                })
                              }
                              disabled={!ruleForm.enableCategoryChange}
                            >
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Choose a category..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  No category assignment
                                </SelectItem>
                                {categories.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id}
                                  >
                                    {category.name}{" "}
                                    {category.subcategory &&
                                      `> ${category.subcategory}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Rename Transaction Action */}
                      <AccordionItem
                        value="rename"
                        className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={ruleForm.enableRename}
                              onCheckedChange={(checked) =>
                                setRuleForm({
                                  ...ruleForm,
                                  enableRename: checked,
                                })
                              }
                              data-testid="switch-enable-rename"
                            />
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="font-medium">
                              Rename Transactions
                            </span>
                            {ruleForm.enableRename &&
                              ruleForm.renameTransactionTo && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 max-w-32 truncate"
                                >
                                  {ruleForm.renameTransactionTo}
                                </Badge>
                              )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-3">
                            <Label
                              htmlFor="rename-to"
                              className="text-sm font-medium"
                            >
                              New transaction description
                            </Label>
                            <Input
                              id="rename-to"
                              value={ruleForm.renameTransactionTo}
                              onChange={(e) =>
                                setRuleForm({
                                  ...ruleForm,
                                  renameTransactionTo: e.target.value,
                                })
                              }
                              placeholder="e.g., Coffee Purchase, Monthly Subscription..."
                              disabled={!ruleForm.enableRename}
                              data-testid="input-rename-to"
                            />
                            <p className="text-xs text-gray-500">
                              This will replace the original transaction
                              description
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Apply Tags Action */}
                      <AccordionItem
                        value="tags"
                        className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={ruleForm.enableTagging}
                              onCheckedChange={(checked) =>
                                setRuleForm({
                                  ...ruleForm,
                                  enableTagging: checked,
                                })
                              }
                              data-testid="switch-enable-tagging"
                            />
                            <Hash className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium">Apply Tags</span>
                            {ruleForm.enableTagging &&
                              ruleForm.addTagIds.length > 0 && (
                                <Badge variant="outline" className="ml-2">
                                  {ruleForm.addTagIds.length} tag
                                  {ruleForm.addTagIds.length !== 1 ? "s" : ""}
                                </Badge>
                              )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">
                              Select tags to apply automatically
                            </Label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                              {tags.map((tag) => (
                                <div
                                  key={tag.id}
                                  className="flex items-center space-x-2"
                                >
                                  <Switch
                                    checked={ruleForm.addTagIds.includes(
                                      tag.id,
                                    )}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setRuleForm({
                                          ...ruleForm,
                                          addTagIds: [
                                            ...ruleForm.addTagIds,
                                            tag.id,
                                          ],
                                        });
                                      } else {
                                        setRuleForm({
                                          ...ruleForm,
                                          addTagIds: ruleForm.addTagIds.filter(
                                            (id) => id !== tag.id,
                                          ),
                                        });
                                      }
                                    }}
                                    disabled={!ruleForm.enableTagging}
                                    data-testid={`switch-tag-${tag.id}`}
                                  />
                                  <Badge
                                    style={{
                                      backgroundColor: tag.color,
                                      color: "white",
                                    }}
                                    className="text-xs"
                                  >
                                    {tag.name}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Ignore Transaction Action */}
                      <AccordionItem
                        value="ignore"
                        className="border rounded-lg p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={ruleForm.enableIgnore}
                              onCheckedChange={(checked) =>
                                setRuleForm({
                                  ...ruleForm,
                                  enableIgnore: checked,
                                })
                              }
                              data-testid="switch-enable-ignore"
                            />
                            <EyeOff className="h-4 w-4 text-red-600" />
                            <span className="font-medium">
                              Ignore Transactions
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={ruleForm.ignoreTransaction}
                                onCheckedChange={(checked) =>
                                  setRuleForm({
                                    ...ruleForm,
                                    ignoreTransaction: checked,
                                  })
                                }
                                disabled={!ruleForm.enableIgnore}
                                data-testid="switch-ignore-transaction"
                              />
                              <Label
                                htmlFor="ignore-transaction"
                                className="text-sm font-medium"
                              >
                                Hide from all views
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={ruleForm.ignoreForBudgeting}
                                onCheckedChange={(checked) =>
                                  setRuleForm({
                                    ...ruleForm,
                                    ignoreForBudgeting: checked,
                                  })
                                }
                                disabled={!ruleForm.enableIgnore}
                                data-testid="switch-ignore-budgeting"
                              />
                              <Label
                                htmlFor="ignore-budgeting"
                                className="text-sm font-medium"
                              >
                                Exclude from budget calculations
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={ruleForm.ignoreForReporting}
                                onCheckedChange={(checked) =>
                                  setRuleForm({
                                    ...ruleForm,
                                    ignoreForReporting: checked,
                                  })
                                }
                                disabled={!ruleForm.enableIgnore}
                                data-testid="switch-ignore-reporting"
                              />
                              <Label
                                htmlFor="ignore-reporting"
                                className="text-sm font-medium"
                              >
                                Exclude from reports
                              </Label>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  {/* Preview Section */}
                  <div className="space-y-4 pt-6">
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-lg">
                          Preview Changes
                        </h4>
                        <Badge
                          variant="secondary"
                          className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700"
                        >
                          Test your rule
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handlePreviewRule}
                        disabled={
                          !ruleForm.merchantPattern &&
                          !ruleForm.descriptionPattern &&
                          !ruleForm.amountMin &&
                          !ruleForm.amountMax
                        }
                        data-testid="button-preview-rule"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Matches
                      </Button>
                    </div>

                    {showPreview && (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              Matching Transactions
                            </span>
                            <Badge variant="outline">
                              {previewResults.length} found
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowPreview(false)}
                            data-testid="button-close-preview"
                          >
                            Close Preview
                          </Button>
                        </div>

                        {previewResults.length > 0 ? (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {previewResults.map((transaction, index) => (
                              <div
                                key={transaction.id || index}
                                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">
                                        {ruleForm.enableRename &&
                                        ruleForm.renameTransactionTo
                                          ? ruleForm.renameTransactionTo
                                          : transaction.description}
                                      </span>
                                      {ruleForm.enableRename &&
                                        ruleForm.renameTransactionTo && (
                                          <ArrowRight className="h-3 w-3 text-green-600" />
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {transaction.merchant} •{" "}
                                      {formatDate(transaction.date)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium text-sm">
                                      {formatCurrency(
                                        parseFloat(
                                          transaction.amount.toString(),
                                        ),
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      {ruleForm.enableCategoryChange &&
                                        ruleForm.setCategoryId !== "none" && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-blue-100 text-blue-700"
                                          >
                                            {
                                              categories.find(
                                                (c) =>
                                                  c.id ===
                                                  ruleForm.setCategoryId,
                                              )?.name
                                            }
                                          </Badge>
                                        )}
                                      {ruleForm.enableTagging &&
                                        ruleForm.addTagIds.length > 0 && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-yellow-100 text-yellow-700"
                                          >
                                            +{ruleForm.addTagIds.length} tags
                                          </Badge>
                                        )}
                                      {ruleForm.enableIgnore &&
                                        ruleForm.ignoreTransaction && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-red-100 text-red-700"
                                          >
                                            Hidden
                                          </Badge>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              No transactions match your criteria
                            </p>
                            <p className="text-xs">
                              Try adjusting your rule conditions
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={handleCreateRule}
                      disabled={!ruleForm.name || createRuleMutation.isPending}
                      data-testid="button-save-rule"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      {createRuleMutation.isPending
                        ? "Creating..."
                        : editingRule
                          ? "Update Rule"
                          : "Create Rule"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setIsCreateRuleOpen(false);
                        setEditingRule(null);
                      }}
                      data-testid="button-cancel-rule"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    {previewResults.length > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700"
                      >
                        Ready to process {previewResults.length} transactions
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4
                    className="font-medium"
                    data-testid={`rule-name-${rule.id}`}
                  >
                    {rule.name}
                  </h4>
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">Priority: {rule.priority}</Badge>
                  {(rule.appliedCount || 0) > 0 && (
                    <Badge variant="outline">
                      Applied {rule.appliedCount || 0} times
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditRule(rule)}
                    data-testid={`button-edit-rule-${rule.id}`}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                    disabled={deleteRuleMutation.isPending}
                    data-testid={`button-delete-rule-${rule.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {rule.description && (
                <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
              )}
              <div className="text-xs text-gray-500 space-y-1">
                {rule.merchantPattern && (
                  <div>Merchant: {rule.merchantPattern}</div>
                )}
                {rule.descriptionPattern && (
                  <div>Description: {rule.descriptionPattern}</div>
                )}
                {(rule.amountMin || rule.amountMax) && (
                  <div>
                    Amount:{" "}
                    {rule.amountMin &&
                      formatCurrency(parseFloat(rule.amountMin))}
                    {rule.amountMin && rule.amountMax && " - "}
                    {rule.amountMax &&
                      formatCurrency(parseFloat(rule.amountMax))}
                  </div>
                )}
                {rule.setCategoryId && (
                  <div>
                    Auto-category:{" "}
                    {categories.find((c) => c.id === rule.setCategoryId)?.name}
                  </div>
                )}
                {(rule.ignoreForBudgeting || rule.ignoreForReporting) && (
                  <div>
                    Ignores: {rule.ignoreForBudgeting && "budgeting"}
                    {rule.ignoreForBudgeting && rule.ignoreForReporting && ", "}
                    {rule.ignoreForReporting && "reporting"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recurring Override Rules Section */}
        {recurringOverrides.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Smart Recurring Rules</h3>
              <Badge variant="outline">{recurringOverrides.length} active</Badge>
            </div>
            <div className="space-y-3">
              {recurringOverrides.map((override: any) => (
                <div key={override.id} className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium" data-testid={`recurring-rule-${override.id}`}>
                        {override.originalMerchant || override.merchantName}
                      </h4>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {override.recurringStatus === 'recurring' ? 'Recurring' : 'One-time'}
                      </Badge>
                      {override.applyToAll && (
                        <Badge variant="outline" className="border-purple-300">
                          Auto-apply to future
                        </Badge>
                      )}
                      {(override.appliedCount || 0) > 0 && (
                        <Badge variant="outline">
                          Applied {override.appliedCount || 0} times
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // TODO: Add edit functionality for recurring rules
                        toast({
                          title: "Coming Soon",
                          description: "Editing recurring rules will be available soon",
                        });
                      }}
                      data-testid={`button-edit-recurring-${override.id}`}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                  {override.reason && (
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                      {override.reason}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Merchant Pattern: {override.merchantName}</div>
                    {override.relatedTransactionCount > 0 && (
                      <div>Analyzed {override.relatedTransactionCount} transactions</div>
                    )}
                    <div>Created: {formatDate(override.createdAt)}</div>
                    {override.applyToAll && (
                      <div className="text-purple-600 font-medium">
                        ✨ Automatically applies to future {override.originalMerchant || override.merchantName} transactions
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>How Smart Recurring Rules Work:</strong> When you manually select transactions as recurring and enable 
                "Apply to future transactions," the system creates intelligent rules that automatically classify similar 
                future transactions from the same merchant. These rules analyze transaction patterns including amounts, 
                timing, and merchant details to identify recurring payments like subscriptions vs one-time purchases.
              </div>
            </div>
          </div>
        )}

        {/* Edit Rule Dialog */}
        <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Automation Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-rule-name">Rule Name</Label>
                  <Input
                    id="edit-rule-name"
                    data-testid="input-edit-rule-name"
                    value={ruleForm.name}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rule-priority">Priority</Label>
                  <Input
                    id="edit-rule-priority"
                    type="number"
                    data-testid="input-edit-rule-priority"
                    value={ruleForm.priority}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        priority: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-rule-description">Description</Label>
                <Textarea
                  id="edit-rule-description"
                  data-testid="input-edit-rule-description"
                  value={ruleForm.description}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Conditions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-merchant-pattern">
                      Merchant Pattern
                    </Label>
                    <Input
                      id="edit-merchant-pattern"
                      data-testid="input-edit-merchant-pattern"
                      value={ruleForm.merchantPattern}
                      onChange={(e) =>
                        setRuleForm({
                          ...ruleForm,
                          merchantPattern: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description-pattern">
                      Description Pattern
                    </Label>
                    <Input
                      id="edit-description-pattern"
                      data-testid="input-edit-description-pattern"
                      value={ruleForm.descriptionPattern}
                      onChange={(e) =>
                        setRuleForm({
                          ...ruleForm,
                          descriptionPattern: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-amount-min">Min Amount</Label>
                    <Input
                      id="edit-amount-min"
                      type="number"
                      step="0.01"
                      data-testid="input-edit-amount-min"
                      value={ruleForm.amountMin}
                      onChange={(e) =>
                        setRuleForm({ ...ruleForm, amountMin: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-amount-max">Max Amount</Label>
                    <Input
                      id="edit-amount-max"
                      type="number"
                      step="0.01"
                      data-testid="input-edit-amount-max"
                      value={ruleForm.amountMax}
                      onChange={(e) =>
                        setRuleForm({ ...ruleForm, amountMax: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-transaction-type">
                      Transaction Type
                    </Label>
                    <Select
                      value={ruleForm.transactionType}
                      onValueChange={(value) =>
                        setRuleForm({ ...ruleForm, transactionType: value })
                      }
                    >
                      <SelectTrigger data-testid="select-edit-transaction-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">
                          Both Income & Expense
                        </SelectItem>
                        <SelectItem value="income">Income Only</SelectItem>
                        <SelectItem value="expense">Expense Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Actions</h4>
                <div>
                  <Label htmlFor="edit-set-category">
                    Auto-assign Category
                  </Label>
                  <Select
                    value={ruleForm.setCategoryId}
                    onValueChange={(value) =>
                      setRuleForm({ ...ruleForm, setCategoryId: value })
                    }
                  >
                    <SelectTrigger data-testid="select-edit-category">
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        No category assignment
                      </SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}{" "}
                          {category.subcategory && `> ${category.subcategory}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-ignore-budgeting"
                      checked={ruleForm.ignoreForBudgeting}
                      onCheckedChange={(checked) =>
                        setRuleForm({
                          ...ruleForm,
                          ignoreForBudgeting: checked,
                        })
                      }
                      data-testid="switch-edit-ignore-budgeting"
                    />
                    <Label htmlFor="edit-ignore-budgeting">
                      Ignore for budgeting
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-ignore-reporting"
                      checked={ruleForm.ignoreForReporting}
                      onCheckedChange={(checked) =>
                        setRuleForm({
                          ...ruleForm,
                          ignoreForReporting: checked,
                        })
                      }
                      data-testid="switch-edit-ignore-reporting"
                    />
                    <Label htmlFor="edit-ignore-reporting">
                      Ignore for reporting
                    </Label>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleUpdateRule}
                disabled={!ruleForm.name || updateRuleMutation.isPending}
                data-testid="button-update-rule"
              >
                Update Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Transaction Splits Component
function TransactionSplitManager() {
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [splits, setSplits] = useState<any[]>([]);
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: categories = [] } = useQuery<AdminCategory[]>({
    queryKey: ["/api/admin/categories"],
  });

  const { data: tags = [] } = useQuery<TransactionTag[]>({
    queryKey: ["/api/transaction-tags"],
  });

  const createSplitMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/transaction-splits", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transaction-splits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setIsSplitDialogOpen(false);
      setSelectedTransaction(null);
      setSplits([]);
      toast({ title: "Transaction split successfully" });
    },
  });

  const handleSplitTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setSplits([
      { description: "", amount: "", categoryId: "", tagIds: [], notes: "" },
      { description: "", amount: "", categoryId: "", tagIds: [], notes: "" },
    ]);
    setIsSplitDialogOpen(true);
  };

  const addSplit = () => {
    setSplits([
      ...splits,
      { description: "", amount: "", categoryId: "", tagIds: [], notes: "" },
    ]);
  };

  const removeSplit = (index: number) => {
    if (splits.length > 2) {
      setSplits(splits.filter((_, i) => i !== index));
    }
  };

  const updateSplit = (index: number, field: string, value: any) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  const handleCreateSplit = () => {
    if (!selectedTransaction) return;

    const totalSplitAmount = splits.reduce(
      (sum, split) => sum + (parseFloat(split.amount) || 0),
      0,
    );
    const transactionAmount = parseFloat(selectedTransaction.amount);

    if (Math.abs(totalSplitAmount - transactionAmount) > 0.01) {
      toast({
        title: "Invalid split amounts",
        description: `Split total (${formatCurrency(totalSplitAmount)}) must equal transaction amount (${formatCurrency(transactionAmount)})`,
        variant: "destructive",
      });
      return;
    }

    const splitData = {
      originalTransactionId: selectedTransaction.id,
      splits: splits.map((split, index) => ({
        ...split,
        amount: parseFloat(split.amount),
        splitOrder: index,
      })),
    };

    createSplitMutation.mutate(splitData);
  };

  const totalSplitAmount = splits.reduce(
    (sum, split) => sum + (parseFloat(split.amount) || 0),
    0,
  );
  const transactionAmount = selectedTransaction
    ? parseFloat(selectedTransaction.amount)
    : 0;
  const remainingAmount = transactionAmount - totalSplitAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Split className="h-5 w-5" />
          Transaction Splits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">
            Select a transaction to split into multiple categories while
            maintaining the original record.
          </p>

          <div className="space-y-2">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(parseFloat(transaction.amount))} •{" "}
                    {transaction.category}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSplitTransaction(transaction)}
                  data-testid={`button-split-${transaction.id}`}
                >
                  <Split className="h-4 w-4 mr-2" />
                  Split
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Split Transaction Dialog */}
        <Dialog open={isSplitDialogOpen} onOpenChange={setIsSplitDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Split Transaction</DialogTitle>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Original Transaction</h4>
                  <p>{selectedTransaction.description}</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(parseFloat(selectedTransaction.amount))}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Split Details</h4>
                    <Button
                      size="sm"
                      onClick={addSplit}
                      data-testid="button-add-split"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Split
                    </Button>
                  </div>

                  {splits.map((split, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Split {index + 1}</h5>
                        {splits.length > 2 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeSplit(index)}
                            data-testid={`button-remove-split-${index}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`split-description-${index}`}>
                            Description
                          </Label>
                          <Input
                            id={`split-description-${index}`}
                            data-testid={`input-split-description-${index}`}
                            value={split.description}
                            onChange={(e) =>
                              updateSplit(index, "description", e.target.value)
                            }
                            placeholder="e.g., Groceries portion"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`split-amount-${index}`}>
                            Amount
                          </Label>
                          <Input
                            id={`split-amount-${index}`}
                            type="number"
                            step="0.01"
                            data-testid={`input-split-amount-${index}`}
                            value={split.amount}
                            onChange={(e) =>
                              updateSplit(index, "amount", e.target.value)
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`split-category-${index}`}>
                          Category
                        </Label>
                        <Select
                          value={split.categoryId}
                          onValueChange={(value) =>
                            updateSplit(index, "categoryId", value)
                          }
                        >
                          <SelectTrigger
                            data-testid={`select-split-category-${index}`}
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}{" "}
                                {category.subcategory &&
                                  `> ${category.subcategory}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor={`split-notes-${index}`}>
                          Notes (Optional)
                        </Label>
                        <Input
                          id={`split-notes-${index}`}
                          data-testid={`input-split-notes-${index}`}
                          value={split.notes}
                          onChange={(e) =>
                            updateSplit(index, "notes", e.target.value)
                          }
                          placeholder="Additional notes for this split"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Total Split Amount:</span>
                      <span
                        className={
                          remainingAmount !== 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {formatCurrency(totalSplitAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Original Amount:</span>
                      <span>{formatCurrency(transactionAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Remaining:</span>
                      <span
                        className={
                          remainingAmount !== 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {formatCurrency(remainingAmount)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateSplit}
                    disabled={
                      Math.abs(remainingAmount) > 0.01 ||
                      createSplitMutation.isPending
                    }
                    data-testid="button-save-split"
                  >
                    Create Split
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default function RulesAutomationPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rules & Automation</h1>
          <p className="text-gray-600 mt-1">
            Create custom tags, automation rules, and split transactions for
            better transaction enrichment.
          </p>
        </div>
      </div>

      <Tabs defaultValue="tags" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tags" data-testid="tab-tags">
            Transaction Tags
          </TabsTrigger>
          <TabsTrigger value="rules" data-testid="tab-rules">
            Automation Rules
          </TabsTrigger>
          <TabsTrigger value="splits" data-testid="tab-splits">
            Transaction Splits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tags">
          <TagManagement />
        </TabsContent>

        <TabsContent value="rules">
          <AutomationRules />
        </TabsContent>

        <TabsContent value="splits">
          <TransactionSplitManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
