import React from "react";
import {
  BarChart2,
  PieChart,
  Wallet,
  CreditCard,
  LineChart,
  Calendar,
  Gauge,
  Goal,
  Sparkles,
  Layers,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WidgetDrawerProps {
  availableWidgets: string[];
  widgetLabels: Record<string, string>;
  isExpanded: boolean;
  onToggle: () => void;
}

// Widget icon mapping
const widgetIcons: Record<string, React.ComponentType<any>> = {
  spending: PieChart,
  netWorth: LineChart,
  transactions: CreditCard,
  budgets: Wallet,
  cashflow: BarChart2,
  tracker: Gauge,
  goals: Goal,
  accounts: Layers,
  netIncome: Calendar,
  insights: Sparkles,
  bills: Calendar,
};

const DraggableWidgetItem = ({ 
  widgetId, 
  label, 
  icon: Icon 
}: { 
  widgetId: string; 
  label: string; 
  icon: React.ComponentType<any> 
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", widgetId);
    e.dataTransfer.effectAllowed = "move";
    
    // Add a custom data attribute to identify this as a new widget from drawer
    e.dataTransfer.setData("application/x-widget-source", "drawer");
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card text-card-foreground shadow-sm cursor-move hover:shadow-md transition-shadow"
      data-testid={`draggable-widget-${widgetId}`}
    >
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm font-medium flex-1">{label}</span>
      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
};

export default function WidgetDrawer({
  availableWidgets,
  widgetLabels,
  isExpanded,
  onToggle,
}: WidgetDrawerProps) {
  if (availableWidgets.length === 0) {
    return null; // Don't show drawer if no widgets available
  }

  return (
    <div className="border-t border-border bg-background">
      {/* Drawer Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
        data-testid="widget-drawer-toggle"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Add Widgets ({availableWidgets.length} available)
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Drawer Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="text-xs text-muted-foreground mb-3">
            Drag widgets from here to add them to your dashboard
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {availableWidgets.map((widgetId) => {
              const Icon = widgetIcons[widgetId] || Layers;
              const label = widgetLabels[widgetId] || widgetId;
              
              return (
                <DraggableWidgetItem
                  key={widgetId}
                  widgetId={widgetId}
                  label={label}
                  icon={Icon}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}