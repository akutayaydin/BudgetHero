import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign, Home, Car, Baby, CreditCard, Smartphone, CheckCircle } from "lucide-react";
import type { BudgetWizardData } from "@shared/schema";
import { budgetWizardSchema } from "@shared/schema";

interface BudgetWizardProps {
  onComplete: (generatedBudgets: any[]) => void;
}

type WizardStep = "household" | "income" | "housing" | "transport" | "childcare" | "debt-savings" | "subscriptions" | "review";

const steps: { id: WizardStep; title: string; icon: any }[] = [
  { id: "household", title: "Household", icon: Home },
  { id: "income", title: "Income", icon: DollarSign },
  { id: "housing", title: "Housing", icon: Home },
  { id: "transport", title: "Transport", icon: Car },
  { id: "childcare", title: "Childcare", icon: Baby },
  { id: "debt-savings", title: "Debt & Savings", icon: CreditCard },
  { id: "subscriptions", title: "Subscriptions", icon: Smartphone },
  { id: "review", title: "Review Budget", icon: CheckCircle },
];

export function BudgetWizard({ onComplete }: BudgetWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("household");
  const [wizardData, setWizardData] = useState<Partial<BudgetWizardData>>({});
  const [generatedBudget, setGeneratedBudget] = useState<any>(null);

  const form = useForm<BudgetWizardData>({
    resolver: zodResolver(budgetWizardSchema),
    defaultValues: wizardData,
  });

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const nextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const generateBudget = (data: BudgetWizardData) => {
    // Budget generation algorithm based on 50/30/20 rule with adjustments
    const monthlyIncome = data.netMonthlyIncome;
    let needsTarget = monthlyIncome * 0.5;
    let wantsTarget = monthlyIncome * 0.3;
    let savingsTarget = monthlyIncome * 0.2;

    // Start with fixed costs
    const housing = data.rentOrMortgage + (data.utilities || estimateUtilities(data.state));
    const debtMinimums = data.debtMinimums;
    
    // Calculate housing burden warning
    const housingBurden = (housing / monthlyIncome) * 100;
    const isHousingBurdened = housingBurden > 30;

    // Transportation costs
    let transport = 0;
    let transportDetails: any = {};
    if (data.transportType === "car") {
      const miles = data.monthlyMiles || 900;
      transportDetails = calculateCarCosts(miles);
      transport = transportDetails.total;
    } else if (data.transportType === "public") {
      transport = data.transitPassCost || estimateTransitCost(data.state);
    } else {
      // Mixed - estimate 70% car, 30% transit
      const carCost = calculateCarCosts((data.monthlyMiles || 600) * 0.7);
      const transitCost = (data.transitPassCost || estimateTransitCost(data.state)) * 0.3;
      transport = carCost.total + transitCost;
    }

    // Childcare costs
    let childcare = 0;
    if (data.dependents !== "no-kids" && data.childcareType && data.childcareType !== "none") {
      childcare = estimateChildcareCost(data.childcareType, data.childcareHours || "full-time", data.state);
    }

    // Groceries estimate based on household size
    const groceries = estimateGroceries(data.relationship, data.dependents);

    // Healthcare estimate
    const healthcare = estimateHealthcare(data.relationship, data.dependents);

    // Subscriptions
    const subscriptions = (data.streaming || 0) + (data.phone || 0) + (data.internet || 0) + (data.gym || 0);

    // Calculate emergency fund target
    const emergencyTarget = monthlyIncome * data.emergencyFundMonths;

    // Generate budget categories with rationales
    const budgetCategories = [
      {
        name: "Housing",
        category: "Housing",
        limit: housing.toString(),
        spent: "0",
        rationale: `Rent/mortgage $${data.rentOrMortgage} + utilities $${data.utilities || estimateUtilities(data.state)} ${isHousingBurdened ? '⚠️ Above 30% recommended limit' : ''}`,
        budgetType: "wizard-generated"
      },
      {
        name: "Groceries",
        category: "Dining",
        limit: groceries.toString(),
        spent: "0",
        rationale: `MIT Living Wage estimate for ${data.relationship} ${data.dependents !== "no-kids" ? "with children" : ""}`,
        budgetType: "wizard-generated"
      },
      {
        name: "Transportation",
        category: "Transport",
        limit: transport.toString(),
        spent: "0",
        rationale: data.transportType === "car" ? 
          `AAA estimate: $${transportDetails.fuel || 0} fuel + $${transportDetails.insurance || 0} insurance + $${transportDetails.maintenance || 0} maintenance (${data.monthlyMiles || 900} miles)` :
          `${data.transportType === "public" ? "Transit pass" : "Mixed car/transit"}`,
        budgetType: "wizard-generated"
      },
      {
        name: "Healthcare",
        category: "Health",
        limit: healthcare.toString(),
        spent: "0",
        rationale: "Estimated based on household size and national averages",
        budgetType: "wizard-generated"
      }
    ];

    if (childcare > 0) {
      budgetCategories.push({
        name: "Childcare",
        category: "Childcare",
        limit: childcare.toString(),
        spent: "0",
        rationale: `State average for ${data.childcareType} ${data.childcareHours} care`,
        budgetType: "wizard-generated"
      });
    }

    if (debtMinimums > 0) {
      budgetCategories.push({
        name: "Debt Payments",
        category: "Debt",
        limit: debtMinimums.toString(),
        spent: "0",
        rationale: "Minimum payments entered by user",
        budgetType: "wizard-generated"
      });
    }

    // Emergency fund
    const emergencyMonthly = emergencyTarget / 12; // Spread over 12 months
    budgetCategories.push({
      name: "Emergency Fund",
      category: "Savings",
      limit: emergencyMonthly.toString(),
      spent: "0",
      rationale: `Building ${data.emergencyFundMonths}-month emergency fund ($${emergencyTarget.toLocaleString()} target)`,
      budgetType: "wizard-generated"
    });

    if (subscriptions > 0) {
      budgetCategories.push({
        name: "Subscriptions",
        category: "Entertainment",
        limit: subscriptions.toString(),
        spent: "0",
        rationale: "Streaming, phone, internet, and gym memberships",
        budgetType: "wizard-generated"
      });
    }

    // Calculate remaining for wants
    const totalNeeds = budgetCategories.reduce((sum, cat) => sum + (parseFloat(cat.limit) || 0), 0);
    const remainingForWants = monthlyIncome - totalNeeds;

    if (remainingForWants > 0) {
      // Distribute wants
      budgetCategories.push({
        name: "Dining Out",
        category: "Dining",
        limit: Math.round(remainingForWants * 0.4).toString(),
        spent: "0",
        rationale: "40% of remaining budget for dining experiences",
        budgetType: "wizard-generated"
      });
      
      budgetCategories.push({
        name: "Entertainment & Shopping",
        category: "Entertainment",
        limit: Math.round(remainingForWants * 0.6).toString(),
        spent: "0",
        rationale: "60% of remaining budget for entertainment and discretionary spending",
        budgetType: "wizard-generated"
      });
    }

    return {
      categories: budgetCategories,
      summary: {
        income: monthlyIncome,
        needs: totalNeeds,
        wants: remainingForWants > 0 ? remainingForWants : 0,
        savings: emergencyMonthly,
        housingBurden,
        isHousingBurdened
      }
    };
  };

  const handleStepComplete = (stepData: any) => {
    const updatedData = { ...wizardData, ...stepData };
    setWizardData(updatedData);

    if (currentStep === "review") {
      const budget = generateBudget(updatedData as BudgetWizardData);
      setGeneratedBudget(budget);
      onComplete(budget.categories);
    } else {
      nextStep();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "household":
        return <HouseholdStep onComplete={handleStepComplete} initialData={wizardData} />;
      case "income":
        return <IncomeStep onComplete={handleStepComplete} initialData={wizardData} />;
      case "housing":
        return <HousingStep onComplete={handleStepComplete} initialData={wizardData} />;
      case "transport":
        return <TransportStep onComplete={handleStepComplete} initialData={wizardData} />;
      case "childcare":
        return <ChildcareStep onComplete={handleStepComplete} initialData={wizardData} />;
      case "debt-savings":
        return <DebtSavingsStep onComplete={handleStepComplete} initialData={wizardData} />;
      case "subscriptions":
        return <SubscriptionsStep onComplete={handleStepComplete} initialData={wizardData} />;
      case "review":
        return <ReviewStep wizardData={wizardData as BudgetWizardData} onComplete={handleStepComplete} />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Create Your Personal Budget</CardTitle>
            <Badge variant="secondary">{currentStepIndex + 1} of {steps.length}</Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {(() => {
              const Icon = steps[currentStepIndex].icon;
              return <Icon className="w-4 h-4" />;
            })()}
            <span>{steps[currentStepIndex].title}</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {renderStep()}

      {/* Navigation */}
      {currentStep !== "review" && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStepIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={nextStep}
            disabled={currentStepIndex === steps.length - 1}
          >
            Skip
          </Button>
        </div>
      )}
    </div>
  );
}

// Individual step components
function HouseholdStep({ onComplete, initialData }: any) {
  const [relationship, setRelationship] = useState(initialData.relationship || "single");
  const [dependents, setDependents] = useState(initialData.dependents || "no-kids");
  const [adultsWorking, setAdultsWorking] = useState(initialData.adultsWorking || 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Tell us about your household
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">Relationship Status</Label>
          <RadioGroup value={relationship} onValueChange={setRelationship} className="mt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single">Single</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="couple" id="couple" />
              <Label htmlFor="couple">Couple</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="family" id="family" />
              <Label htmlFor="family">Family/Other</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-base font-medium">Children/Dependents</Label>
          <Select value={dependents} onValueChange={setDependents}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-kids">No children</SelectItem>
              <SelectItem value="kids-0-5">Young children (0-5)</SelectItem>
              <SelectItem value="kids-6-12">School age (6-12)</SelectItem>
              <SelectItem value="teens-13-17">Teenagers (13-17)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base font-medium">Adults Working</Label>
          <Select value={adultsWorking.toString()} onValueChange={(val) => setAdultsWorking(parseInt(val))}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 adult working</SelectItem>
              <SelectItem value="2">2 adults working</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={() => onComplete({ relationship, dependents, adultsWorking })}
          className="w-full"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}

function IncomeStep({ onComplete, initialData }: any) {
  const [netMonthlyIncome, setNetMonthlyIncome] = useState(initialData.netMonthlyIncome || "");
  const [city, setCity] = useState(initialData.city || "");
  const [state, setState] = useState(initialData.state || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Income & Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="income" className="text-base font-medium">
            Net Monthly Income (take-home pay)
          </Label>
          <Input
            id="income"
            type="number"
            placeholder="4500"
            value={netMonthlyIncome}
            onChange={(e) => setNetMonthlyIncome(e.target.value)}
            className="mt-2"
          />
          <p className="text-sm text-gray-600 mt-1">
            Enter your after-tax income that actually hits your bank account
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city" className="text-base font-medium">City</Label>
            <Input
              id="city"
              placeholder="San Francisco"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="state" className="text-base font-medium">State</Label>
            <Input
              id="state"
              placeholder="CA"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <Button 
          onClick={() => onComplete({ 
            netMonthlyIncome: parseFloat(netMonthlyIncome), 
            city, 
            state 
          })}
          disabled={!netMonthlyIncome}
          className="w-full"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}

function HousingStep({ onComplete, initialData }: any) {
  const [rentOrMortgage, setRentOrMortgage] = useState(initialData.rentOrMortgage || "");
  const [utilities, setUtilities] = useState(initialData.utilities || "");

  const income = initialData.netMonthlyIncome || 0;
  const housingCost = parseFloat(rentOrMortgage || "0") + parseFloat(utilities || "0");
  const housingPercent = income > 0 ? (housingCost / income) * 100 : 0;
  const isWarning = housingPercent > 30;
  const isSevere = housingPercent > 50;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Housing Costs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="rent" className="text-base font-medium">
            Monthly Rent or Mortgage Payment
          </Label>
          <Input
            id="rent"
            type="number"
            placeholder="2500"
            value={rentOrMortgage}
            onChange={(e) => setRentOrMortgage(e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="utilities" className="text-base font-medium">
            Average Monthly Utilities (optional)
          </Label>
          <Input
            id="utilities"
            type="number"
            placeholder="150"
            value={utilities}
            onChange={(e) => setUtilities(e.target.value)}
            className="mt-2"
          />
          <p className="text-sm text-gray-600 mt-1">
            Electricity, gas, water, trash. Leave blank for estimate.
          </p>
        </div>

        {isWarning && (
          <div className={`p-4 rounded-lg border ${isSevere ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${isSevere ? 'text-red-600' : 'text-yellow-600'}`} />
              <div>
                <p className={`font-medium ${isSevere ? 'text-red-900' : 'text-yellow-900'}`}>
                  {isSevere ? 'Severely' : ''} Housing Cost Burdened
                </p>
                <p className={`text-sm ${isSevere ? 'text-red-700' : 'text-yellow-700'}`}>
                  Your housing costs ({housingPercent.toFixed(1)}%) exceed the recommended 30% of income. 
                  This may limit your budget flexibility.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={() => onComplete({ 
            rentOrMortgage: parseFloat(rentOrMortgage || "0"), 
            utilities: utilities ? parseFloat(utilities) : undefined 
          })}
          disabled={!rentOrMortgage || rentOrMortgage === ""}
          className="w-full"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}

function TransportStep({ onComplete, initialData }: any) {
  const [transportType, setTransportType] = useState(initialData.transportType || "car");
  const [monthlyMiles, setMonthlyMiles] = useState(initialData.monthlyMiles || "900");
  const [transitPassCost, setTransitPassCost] = useState(initialData.transitPassCost || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          Transportation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">Primary Transportation</Label>
          <RadioGroup value={transportType} onValueChange={setTransportType} className="mt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="car" id="car" />
              <Label htmlFor="car">Car (own or lease)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public">Public Transit</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mixed" id="mixed" />
              <Label htmlFor="mixed">Mixed (car + transit)</Label>
            </div>
          </RadioGroup>
        </div>

        {(transportType === "car" || transportType === "mixed") && (
          <div>
            <Label htmlFor="miles" className="text-base font-medium">
              Typical Monthly Miles
            </Label>
            <Input
              id="miles"
              type="number"
              placeholder="900"
              value={monthlyMiles}
              onChange={(e) => setMonthlyMiles(e.target.value)}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              Average US driver: 800-1,000 miles per month
            </p>
          </div>
        )}

        {(transportType === "public" || transportType === "mixed") && (
          <div>
            <Label htmlFor="transit" className="text-base font-medium">
              Monthly Transit Pass Cost
            </Label>
            <Input
              id="transit"
              type="number"
              placeholder="100"
              value={transitPassCost}
              onChange={(e) => setTransitPassCost(e.target.value)}
              className="mt-2"
            />
          </div>
        )}

        <Button 
          onClick={() => onComplete({ 
            transportType,
            monthlyMiles: monthlyMiles ? parseFloat(monthlyMiles) : undefined,
            transitPassCost: transitPassCost ? parseFloat(transitPassCost) : undefined
          })}
          className="w-full"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}

function ChildcareStep({ onComplete, initialData }: any) {
  const hasKids = initialData.dependents !== "no-kids";
  const [childcareType, setChildcareType] = useState(initialData.childcareType || "none");
  const [childcareHours, setChildcareHours] = useState(initialData.childcareHours || "full-time");

  if (!hasKids) {
    // Auto-skip if no kids
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Baby className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No childcare needed - skipping to next step...</p>
          <Button 
            onClick={() => onComplete({ childcareType: "none" })}
            className="mt-4"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Baby className="w-5 h-5" />
          Childcare
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">Type of Childcare</Label>
          <RadioGroup value={childcareType} onValueChange={setChildcareType} className="mt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none" />
              <Label htmlFor="none">None needed</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="family" id="family" />
              <Label htmlFor="family">Family/Friend care</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="family-care" id="family-care" />
              <Label htmlFor="family-care">Family Childcare</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="center" id="center" />
              <Label htmlFor="center">Daycare Center</Label>
            </div>
          </RadioGroup>
        </div>

        {childcareType !== "none" && childcareType !== "family" && (
          <div>
            <Label className="text-base font-medium">Hours Needed</Label>
            <Select value={childcareHours} onValueChange={setChildcareHours}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button 
          onClick={() => onComplete({ childcareType, childcareHours })}
          className="w-full"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}

function DebtSavingsStep({ onComplete, initialData }: any) {
  const [emergencyFundMonths, setEmergencyFundMonths] = useState(initialData.emergencyFundMonths || 3);
  const [debtMinimums, setDebtMinimums] = useState(initialData.debtMinimums || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Debt & Savings Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">
            Emergency Fund Target (months of expenses)
          </Label>
          <Select 
            value={emergencyFundMonths.toString()} 
            onValueChange={(val) => setEmergencyFundMonths(parseInt(val))}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 month</SelectItem>
              <SelectItem value="2">2 months</SelectItem>
              <SelectItem value="3">3 months (recommended)</SelectItem>
              <SelectItem value="4">4 months</SelectItem>
              <SelectItem value="5">5 months</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 mt-1">
            3 months is typically recommended for most people
          </p>
        </div>

        <div>
          <Label htmlFor="debt" className="text-base font-medium">
            Total Monthly Debt Minimums (credit cards, loans)
          </Label>
          <Input
            id="debt"
            type="number"
            placeholder="250"
            value={debtMinimums}
            onChange={(e) => setDebtMinimums(e.target.value)}
            className="mt-2"
          />
          <p className="text-sm text-gray-600 mt-1">
            Enter the minimum required payments. Leave blank if no debt.
          </p>
        </div>

        <Button 
          onClick={() => onComplete({ 
            emergencyFundMonths, 
            debtMinimums: debtMinimums ? parseFloat(debtMinimums) : 0 
          })}
          className="w-full"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}

function SubscriptionsStep({ onComplete, initialData }: any) {
  const [streaming, setStreaming] = useState(initialData.streaming || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [internet, setInternet] = useState(initialData.internet || "");
  const [gym, setGym] = useState(initialData.gym || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Monthly Subscriptions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-gray-600">
          Enter your current monthly subscription costs. Leave blank if you don't have them.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="streaming" className="text-base font-medium">
              Streaming Services
            </Label>
            <Input
              id="streaming"
              type="number"
              placeholder="30"
              value={streaming}
              onChange={(e) => setStreaming(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">Netflix, Spotify, etc.</p>
          </div>

          <div>
            <Label htmlFor="phone" className="text-base font-medium">
              Phone Plan
            </Label>
            <Input
              id="phone"
              type="number"
              placeholder="70"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="internet" className="text-base font-medium">
              Internet
            </Label>
            <Input
              id="internet"
              type="number"
              placeholder="80"
              value={internet}
              onChange={(e) => setInternet(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="gym" className="text-base font-medium">
              Gym/Fitness
            </Label>
            <Input
              id="gym"
              type="number"
              placeholder="50"
              value={gym}
              onChange={(e) => setGym(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <Button 
          onClick={() => onComplete({ 
            streaming: streaming ? parseFloat(streaming) : 0,
            phone: phone ? parseFloat(phone) : 0,
            internet: internet ? parseFloat(internet) : 0,
            gym: gym ? parseFloat(gym) : 0
          })}
          className="w-full"
        >
          Generate My Budget
        </Button>
      </CardContent>
    </Card>
  );
}

function ReviewStep({ wizardData, onComplete }: { wizardData: BudgetWizardData; onComplete: any }) {
  const generateBudget = (data: BudgetWizardData) => {
    // Budget generation algorithm based on 50/30/20 rule with adjustments
    const monthlyIncome = data.netMonthlyIncome;
    const housing = data.rentOrMortgage + (data.utilities || estimateUtilities(data.state));
    const groceries = estimateGroceries(data.relationship, data.dependents);
    const healthcare = estimateHealthcare(data.relationship, data.dependents);
    
    // Transportation costs
    let transport = 0;
    if (data.transportType === "car") {
      const miles = data.monthlyMiles || 900;
      transport = calculateCarCosts(miles).total;
    } else if (data.transportType === "public") {
      transport = data.transitPassCost || estimateTransitCost(data.state);
    } else {
      const carCost = calculateCarCosts((data.monthlyMiles || 600) * 0.7);
      const transitCost = (data.transitPassCost || estimateTransitCost(data.state)) * 0.3;
      transport = carCost.total + transitCost;
    }

    // Childcare costs
    let childcare = 0;
    if (data.dependents !== "no-kids" && data.childcareType && data.childcareType !== "none") {
      childcare = estimateChildcareCost(data.childcareType, data.childcareHours || "full-time", data.state);
    }

    const subscriptions = (data.streaming || 0) + (data.phone || 0) + (data.internet || 0) + (data.gym || 0);
    const emergencyTarget = monthlyIncome * data.emergencyFundMonths;
    const emergencyMonthly = emergencyTarget / 12;

    const budgetItems = [
      { name: "Housing", amount: housing, category: "Needs" },
      { name: "Groceries", amount: groceries, category: "Needs" },
      { name: "Transportation", amount: transport, category: "Needs" },
      { name: "Healthcare", amount: healthcare, category: "Needs" },
      ...(childcare > 0 ? [{ name: "Childcare", amount: childcare, category: "Needs" }] : []),
      ...(data.debtMinimums > 0 ? [{ name: "Debt Payments", amount: data.debtMinimums, category: "Needs" }] : []),
      { name: "Emergency Fund", amount: emergencyMonthly, category: "Savings" },
      ...(subscriptions > 0 ? [{ name: "Subscriptions", amount: subscriptions, category: "Wants" }] : []),
    ];

    const totalNeeds = budgetItems.filter(item => item.category === "Needs").reduce((sum, item) => sum + item.amount, 0);
    const remainingForWants = Math.max(0, monthlyIncome - totalNeeds - emergencyMonthly);
    
    if (remainingForWants > 0) {
      budgetItems.push(
        { name: "Dining Out", amount: Math.round(remainingForWants * 0.4), category: "Wants" },
        { name: "Entertainment & Shopping", amount: Math.round(remainingForWants * 0.6), category: "Wants" }
      );
    }

    return {
      items: budgetItems,
      totalIncome: monthlyIncome,
      totalNeeds,
      totalWants: remainingForWants + subscriptions,
      totalSavings: emergencyMonthly
    };
  };

  const budget = generateBudget(wizardData);
  const housingBurden = (wizardData.rentOrMortgage + (wizardData.utilities || 0)) / wizardData.netMonthlyIncome * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Your Personalized Budget
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">Monthly Budget Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-green-800">${budget.totalNeeds.toLocaleString()}</div>
              <div className="text-green-600">Needs</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-800">${budget.totalWants.toLocaleString()}</div>
              <div className="text-blue-600">Wants</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-800">${budget.totalSavings.toLocaleString()}</div>
              <div className="text-purple-600">Savings</div>
            </div>
          </div>
        </div>

        {housingBurden > 30 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">Housing costs are {housingBurden.toFixed(1)}% of income (above recommended 30%)</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h5 className="font-medium">Budget Categories ({budget.items.length} categories)</h5>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {budget.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm font-medium">{item.name}</span>
                <div className="text-right">
                  <div className="font-semibold">${item.amount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{item.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={() => onComplete({})}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          Save My Budget
        </Button>
      </CardContent>
    </Card>
  );
}

// Utility functions for cost estimation
function estimateUtilities(state?: string): number {
  // Simplified utility estimates by region
  const stateAverages: Record<string, number> = {
    "CA": 180, "NY": 160, "TX": 140, "FL": 130, "IL": 120
  };
  return stateAverages[state || ""] || 150;
}

function calculateCarCosts(miles: number) {
  // AAA 2024 cost per mile estimates
  const fuelCostPerMile = 0.149;
  const insuranceCostPerMile = 0.143;
  const maintenanceCostPerMile = 0.084;

  return {
    fuel: Math.round(miles * fuelCostPerMile),
    insurance: Math.round(miles * insuranceCostPerMile),
    maintenance: Math.round(miles * maintenanceCostPerMile),
    total: Math.round(miles * (fuelCostPerMile + insuranceCostPerMile + maintenanceCostPerMile))
  };
}

function estimateTransitCost(state?: string): number {
  const stateCosts: Record<string, number> = {
    "CA": 120, "NY": 130, "IL": 105, "MA": 90, "WA": 100
  };
  return stateCosts[state || ""] || 75;
}

function estimateChildcareCost(type: string, hours: string, state?: string): number {
  // Very simplified state childcare estimates (monthly)
  const baseCosts = {
    "family-care": hours === "full-time" ? 800 : 500,
    "center": hours === "full-time" ? 1200 : 750,
  };
  
  const stateCostMultiplier: Record<string, number> = {
    "CA": 1.4, "NY": 1.3, "MA": 1.3, "WA": 1.2, "IL": 1.1
  };

  const baseCost = baseCosts[type as keyof typeof baseCosts] || 0;
  const multiplier = stateCostMultiplier[state || ""] || 1.0;
  
  return Math.round(baseCost * multiplier);
}

function estimateGroceries(relationship: string, dependents: string): number {
  // MIT Living Wage simplified estimates
  let base = 300; // Single person
  
  if (relationship === "couple") base = 550;
  if (relationship === "family") base = 650;
  
  if (dependents !== "no-kids") {
    if (dependents === "kids-0-5") base += 150;
    else if (dependents === "kids-6-12") base += 200;
    else if (dependents === "teens-13-17") base += 300;
  }
  
  return base;
}

function estimateHealthcare(relationship: string, dependents: string): number {
  let base = 200; // Single person
  
  if (relationship === "couple") base = 400;
  if (dependents !== "no-kids") base += 200;
  
  return base;
}