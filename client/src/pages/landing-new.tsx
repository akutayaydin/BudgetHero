import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeroShieldLogo } from "@/components/hero-shield-logo";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Shield,
  Zap,
  Brain,
  Target,
  Calendar,
  CreditCard,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Star,
  Upload,
  Eye,
  Activity,
  Layers,
  Users,
  FileText,
  DollarSign,
  Percent,
  Globe,
  Lock,
  Sparkles,
  ChevronRight,
  PlayCircle,
  LogIn,
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const coreFeatures = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Intelligence",
      description:
        "Advanced machine learning automatically categorizes transactions, detects patterns, and provides personalized insights to optimize your financial habits",
      highlight: "90%+ accuracy with continuous learning",
      benefits: [
        "Smart transaction categorization",
        "Spending pattern detection",
        "Personalized recommendations",
        "Behavioral insights",
      ],
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Live Bank Integration",
      description:
        "Secure connection to 11,000+ banks and credit unions via Plaid. Real-time transaction sync with bank-level encryption and security",
      highlight: "Connect in under 2 minutes",
      benefits: [
        "11,000+ supported institutions",
        "Real-time transaction sync",
        "Bank-level security",
        "Automatic account updates",
      ],
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Professional Dashboard",
      description:
        "Executive-grade financial overview with interactive charts, KPIs, spending trends, and comprehensive analytics in one unified interface",
      highlight: "See your complete financial picture",
      benefits: [
        "Real-time financial KPIs",
        "Interactive visualizations",
        "Spending trend analysis",
        "Net worth tracking",
      ],
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Smart Budget Wizard",
      description:
        "AI-powered 8-step questionnaire creates personalized budgets using the proven 50/30/20 framework, tailored to your income and goals",
      highlight: "Budget created in 5 questions",
      benefits: [
        "50/30/20 framework",
        "Personalized recommendations",
        "Goal-based planning",
        "Automatic adjustments",
      ],
    },
    {
      icon: <Activity className="h-8 w-8" />,
      title: "Advanced Analytics",
      description:
        "Institutional-grade analysis including spending velocity, diversity indices, cash flow patterns, and predictive financial modeling",
      highlight: "Enterprise-level insights",
      benefits: [
        "Spending velocity analysis",
        "Cash flow forecasting",
        "Merchant insights",
        "Behavioral patterns",
      ],
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Gamified Experience",
      description:
        "Turn financial management into an engaging game with categorization challenges, achievement streaks, and personalized avatars",
      highlight: "Make finance fun and rewarding",
      benefits: [
        "Categorization mini-games",
        "Achievement system",
        "Progress tracking",
        "Avatar customization",
      ],
    },
  ];

  const advancedFeatures = [
    {
      icon: <Upload className="h-5 w-5" />,
      name: "Smart CSV Import",
      desc: "Universal bank statement parsing",
    },
    {
      icon: <Percent className="h-5 w-5" />,
      name: "Savings Rate Tracking",
      desc: "Monitor wealth accumulation",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      name: "12-Month Trend Analysis",
      desc: "Long-term financial patterns",
    },
    {
      icon: <PieChart className="h-5 w-5" />,
      name: "Category Breakdown",
      desc: "Detailed spending analysis",
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      name: "Budget vs Actual",
      desc: "Real-time budget tracking",
    },
    {
      icon: <Layers className="h-5 w-5" />,
      name: "Multi-Account Management",
      desc: "Unified account oversight",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      name: "Advanced Search",
      desc: "Find any transaction instantly",
    },
    {
      icon: <Users className="h-5 w-5" />,
      name: "Merchant Insights",
      desc: "Spending pattern analysis",
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      name: "Net Worth Tracking",
      desc: "Assets & liabilities overview",
    },
    {
      icon: <Globe className="h-5 w-5" />,
      name: "Mobile-First Design",
      desc: "Optimized for any device",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      name: "Bank-Level Security",
      desc: "Military-grade encryption",
    },
    {
      icon: <Eye className="h-5 w-5" />,
      name: "Privacy Controls",
      desc: "Your data stays private",
    },
  ];

  const benefits = [
    {
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      title: "Save 10+ Hours Monthly",
      description:
        "Automated categorization and insights eliminate manual finance work",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      title: "Increase Savings by 23%",
      description: "AI-powered recommendations help users save more on average",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      title: "Reduce Financial Stress",
      description:
        "Clear insights and automated tracking provide peace of mind",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      title: "Make Better Decisions",
      description:
        "Data-driven insights help optimize spending and investment choices",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <HeroShieldLogo size="lg" showText={true} showTagline={true} />

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="hidden sm:flex text-gray-600 hover:text-gray-900"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Features
            </Button>
            <Button
              onClick={handleLogin}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 px-6"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 opacity-70"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge
            variant="secondary"
            className="mb-8 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200 px-4 py-2 text-sm font-semibold shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            New: Deep Analytics & Real Bank Integration
          </Badge>

          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Level Up Your Money with
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
              BudgetHero
            </span>
          </h1>

          <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            The gamified personal finance platform that transforms boring
            budgets into an engaging adventure. AI-powered insights, real bank
            connections, and enterprise-grade analytics make financial success
            achievable and fun.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <PlayCircle className="mr-3 h-6 w-6" />
              Start to Save and Earn
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-4 text-lg font-medium border-2 hover:bg-gray-50"
            >
              See Features
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center items-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">14 day Trial</span>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">No Credit Card</span>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Bank-Level Security</span>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">11,000+ Banks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge
              variant="outline"
              className="mb-4 text-blue-600 border-blue-200"
            >
              CORE FEATURES
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Your Complete
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {" "}
                Financial Command Center
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to master your money in one powerful, gamified
              platform
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {coreFeatures.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50 overflow-hidden group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-pink-200 transition-all duration-300">
                      <div className="text-purple-600 group-hover:text-purple-700 transition-colors duration-300">
                        {feature.icon}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-semibold border-green-200"
                    >
                      {feature.highlight}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl text-gray-900 mb-3 group-hover:text-purple-900 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed text-lg mb-4">
                    {feature.description}
                  </CardDescription>
                  <div className="grid grid-cols-2 gap-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div
                        key={benefitIndex}
                        className="flex items-center space-x-2 text-sm text-gray-500"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Grid */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 text-purple-600 border-purple-200"
            >
              ADVANCED CAPABILITIES
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Institutional-Grade Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional-level tools typically found only in enterprise
              financial software
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-white/50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <div className="text-white">{feature.icon}</div>
                </div>
                <p className="font-semibold text-gray-900 text-base mb-2">
                  {feature.name}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 text-purple-600 border-purple-200"
            >
              PROVEN RESULTS
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Transform Your Financial Life
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands who have already leveled up their money management
              with BudgetHero
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100"
              >
                {benefit.icon}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <div className="flex justify-center items-center space-x-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-6 h-6 text-yellow-400 fill-current"
                />
              ))}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              4.9/5 from satisfied users
            </p>
            <p className="text-gray-600 text-lg">
              "Finally, a finance app that makes budgeting actually enjoyable!"
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">
            Ready to Master Your Money?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands who've transformed their financial lives with
            AI-powered insights, real bank data, and professional-grade
            analytics. Start your journey today.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              onClick={handleLogin}
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-4 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="mr-3 h-6 w-6" />
              Start Free Today
            </Button>
          </div>

          <div className="flex flex-wrap justify-center items-center space-x-8 mt-12 text-blue-100">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">Setup in 2 minutes</span>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">No hidden fees</span>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-6 md:mb-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold">BudgetHero</p>
                <p className="text-sm text-gray-400">Level Up Your Money</p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400 mb-2">
                © 2025 BudgetHero. All rights reserved.
              </p>
              <p className="text-xs text-gray-500">
                Secure • Private • Professional-Grade Analytics
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
