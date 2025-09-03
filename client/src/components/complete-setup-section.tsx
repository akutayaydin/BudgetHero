import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Settings, Crown, Target, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";

interface SubscriptionStatus {
  subscriptionPlan: string;
  subscriptionStatus: string;
  isTrialActive: boolean;
  trialEndsAt?: string;
}

interface SetupTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action: string;
  href?: string;
  priority: 'high' | 'medium' | 'low';
  icon: any;
}

export function CompleteSetupSection() {
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
  });

  // Define setup tasks based on subscription status
  const setupTasks: SetupTask[] = [
    {
      id: 'reactivate-premium',
      title: 'Reactivate Premium',
      description: 'Continue your premium features and benefits',
      completed: false,
      action: 'Upgrade Now',
      href: '/subscription/plans',
      priority: 'high',
      icon: Crown,
      // Only show if trial is active
      ...(subscriptionStatus?.isTrialActive ? {} : { completed: true })
    },
    {
      id: 'start-goals',
      title: 'Start Saving with Goals',
      description: 'Set up automatic savings to reach your financial targets',
      completed: false,
      action: 'Create Goal',
      href: '/goals',
      priority: 'medium',
      icon: Target
    },
    {
      id: 'connect-accounts',
      title: 'Connect More Accounts', 
      description: 'Link all your financial accounts for a complete picture',
      completed: false,
      action: 'Add Account',
      href: '/accounts',
      priority: 'medium',
      icon: Settings
    }
  ];

  const incompleteTasks = setupTasks.filter(task => !task.completed);
  const completedTasks = setupTasks.filter(task => task.completed);
  const completionRate = Math.round((completedTasks.length / setupTasks.length) * 100);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30';
      case 'medium': return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30';
      case 'low': return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30';
      default: return 'border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Complete Setup
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {completedTasks.length} / {setupTasks.length} complete
              </p>
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                <div 
                  className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {completionRate}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Incomplete Tasks */}
        {incompleteTasks.map((task) => {
          const IconComponent = task.icon;
          const isHighPriority = task.priority === 'high';
          
          return (
            <div 
              key={task.id} 
              className={`border-2 ${isHighPriority ? 'border-dashed' : 'border-solid'} ${getPriorityColor(task.priority)} rounded-lg p-4`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    task.priority === 'high' ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' :
                    task.priority === 'medium' ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {task.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {task.description}
                    </p>
                    {task.priority === 'high' && (
                      <Badge variant="destructive" className="mt-1 text-xs">
                        High Priority
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {task.href ? (
                    <Link href={task.href}>
                      <Button 
                        className={
                          task.priority === 'high' 
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                            : ''
                        }
                      >
                        {task.action}
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      className={
                        task.priority === 'high' 
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                          : ''
                      }
                    >
                      {task.action}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Completed Tasks Toggle */}
        {completedTasks.length > 0 && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-gray-600 dark:text-gray-400"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {showCompleted ? 'Hide' : 'Show'} Completed Tasks ({completedTasks.length})
              {showCompleted ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>

            {showCompleted && (
              <div className="space-y-2 mt-3">
                {completedTasks.map((task) => {
                  const IconComponent = task.icon;
                  
                  return (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-75">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-950/30 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-white line-through">
                          {task.title}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {task.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        Complete
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}