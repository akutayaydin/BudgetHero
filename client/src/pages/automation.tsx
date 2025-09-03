import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SettingsIcon, RefreshCcwIcon, TagIcon, BrainIcon } from 'lucide-react';
import AutomationRulesSection from '@/components/automation-rules-section';

export default function AutomationPage() {
  const handleAddRule = () => {
    // TODO: Open rule creation modal/dialog
    console.log('Add new automation rule');
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl space-y-6" data-testid="automation-page">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg">
            <SettingsIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Automation & Rules
            </h1>
            <p className="text-muted-foreground">
              Manage automated transaction processing and smart categorization rules
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCcwIcon className="h-5 w-5 text-purple-600" />
              Recurring Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              Smart detection of subscription services, bills, and recurring payments with user override capabilities.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TagIcon className="h-5 w-5 text-blue-600" />
              Smart Categorization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              Automated transaction categorization using merchant matching and intelligent pattern recognition.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BrainIcon className="h-5 w-5 text-green-600" />
              Learning Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              System learns from your corrections and preferences to improve future automation accuracy.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Main Automation Rules Section */}
      <AutomationRulesSection onAddRule={handleAddRule} />

      {/* Help Section */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">How Automation Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Recurring Transaction Detection</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Analyzes transaction patterns automatically</li>
                <li>• Detects monthly, quarterly, and annual payments</li>
                <li>• Allows manual override for any merchant</li>
                <li>• Learns from your feedback to improve accuracy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Smart Categorization</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Uses merchant database for instant matching</li>
                <li>• Applies keyword-based classification</li>
                <li>• Respects your manual category overrides</li>
                <li>• Continuously improves with usage</li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Pro Tip
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Review transactions on the Transactions page to mark merchants as recurring or one-time. 
              The system will remember your preferences and apply them to future transactions automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}