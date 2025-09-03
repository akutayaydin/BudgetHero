import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { 
  RefreshCcwIcon, 
  SettingsIcon, 
  TrendingUpIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  EditIcon
} from 'lucide-react';
import { 
  useRecurringOverrides, 
  useRecurringOverrideSummary, 
  useDeleteRecurringOverride,
  type UserRecurringOverride 
} from '../hooks/use-recurring-overrides';
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';

interface AutomationRulesSectionProps {
  onAddRule?: () => void;
}

export function AutomationRulesSection({ onAddRule }: AutomationRulesSectionProps) {
  const { toast } = useToast();
  const { data: overrides = [], isLoading: overridesLoading, refetch: refetchOverrides } = useRecurringOverrides();
  const { data: summary, isLoading: summaryLoading } = useRecurringOverrideSummary();
  const deleteOverrideMutation = useDeleteRecurringOverride();

  const handleDeleteOverride = async (override: UserRecurringOverride) => {
    if (!confirm(`Remove override for "${override.merchantName}"?`)) return;

    try {
      await deleteOverrideMutation.mutateAsync(override.id);
      toast({
        title: 'Override removed',
        description: `Removed recurring override for "${override.merchantName}"`,
      });
      refetchOverrides();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove override',
        variant: 'destructive'
      });
    }
  };

  const RecurringOverrideCard = ({ override }: { override: UserRecurringOverride }) => (
    <Card key={override.id} className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{override.merchantName}</h4>
              <Badge 
                variant={override.recurringStatus === 'recurring' ? 'default' : 'secondary'}
                className={override.recurringStatus === 'recurring' 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : 'bg-red-100 text-red-800 border-red-300'
                }
              >
                {override.recurringStatus === 'recurring' ? (
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                ) : (
                  <XCircleIcon className="h-3 w-3 mr-1" />
                )}
                {override.recurringStatus === 'recurring' ? 'Recurring' : 'One-time'}
              </Badge>
              
              {override.applyToAll && (
                <Badge variant="outline" className="text-xs">
                  Apply to All
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Applied {override.appliedCount} times to {override.relatedTransactionCount} related transactions
              </p>
              {override.reason && (
                <p className="italic">"{override.reason}"</p>
              )}
              <p>Created {format(new Date(override.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch 
              checked={override.isActive} 
              disabled 
              className="data-[state=checked]:bg-green-600" 
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteOverride(override)}
              disabled={deleteOverrideMutation.isPending}
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
              data-testid={`delete-override-${override.id}`}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6" data-testid="automation-rules-section">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <RefreshCcwIcon className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {summaryLoading ? '...' : summary?.totalOverrides || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Rules
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {summaryLoading ? '...' : summary?.recurringCount || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Recurring
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {summaryLoading ? '...' : summary?.totalApplications || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Applications
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>
                Manage recurring transaction overrides and other automation rules
              </CardDescription>
            </div>
            <Button 
              onClick={onAddRule}
              className="flex items-center gap-2"
              data-testid="add-rule-button"
            >
              <PlusIcon className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recurring-overrides" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recurring-overrides">Recurring Overrides</TabsTrigger>
              <TabsTrigger value="other-rules" disabled>Other Rules</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recurring-overrides" className="space-y-4">
              {overridesLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading recurring overrides...
                </div>
              ) : overrides.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCcwIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No recurring overrides yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by reviewing transactions and marking merchants as recurring or one-time
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {overrides.map((override) => (
                      <RecurringOverrideCard key={override.id} override={override} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="other-rules">
              <div className="text-center py-8 text-muted-foreground">
                <SettingsIcon className="h-12 w-12 mx-auto mb-4" />
                <p>Other automation rules coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AutomationRulesSection;