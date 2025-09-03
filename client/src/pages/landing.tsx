import { Link } from "wouter";
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
import { SEOHead } from "@/components/seo-head";
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
  Award,
  TrendingDown,
  PiggyBank,
  Gamepad2,
  Heart,
  MessageSquare,
  Lightbulb,
  Trophy,
  Timer,
  AlertCircle,
  Coins,
  Banknote,
  User,
} from "lucide-react";

export default function Landing() {
  // Check if this is from account switching
  const urlParams = new URLSearchParams(window.location.search);
  const isAccountSwitch = urlParams.get("switch-account") === "true";
  const switchMethod = urlParams.get("method");

  // Check for account switch cookie flag
  const accountSwitchCookie = document.cookie.includes(
    "account_switch_requested=true",
  );

  console.log("Landing page - URL params:", window.location.search);
  console.log("Landing page - isAccountSwitch:", isAccountSwitch);
  console.log("Landing page - switchMethod:", switchMethod);
  console.log("Landing page - accountSwitchCookie:", accountSwitchCookie);

  const handleLogin = () => {
    window.location.href = "/auth";
  };

  const heroFeatures = [
    {
      icon: <Gamepad2 className="h-8 w-8" />,
      title: "Gamified Experience",
      description:
        "Level up your financial skills with interactive challenges, achievement badges, and progress tracking that makes managing money fun and engaging",
      highlight: "Turn budgeting into a game",
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Financial Health Score",
      description:
        "Get your personalized financial wellness rating with actionable insights to improve your score and build a stronger financial foundation",
      highlight: "See your financial fitness level",
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI Money Assistant",
      description:
        "Your personal financial advisor powered by AI - get smart recommendations, spending alerts, and personalized tips to optimize your money",
      highlight: "24/7 intelligent guidance",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Smart Spending Trends",
      description:
        "Advanced analytics reveal your spending patterns, predict future expenses, and identify opportunities to save money automatically",
      highlight: "Predict and optimize spending",
    },
  ];

  const gameFeatures = [
    {
      icon: <Trophy className="h-6 w-6" />,
      title: "Achievement System",
      description:
        "Earn badges for financial milestones: 'Savings Streak', 'Budget Master', 'Debt Crusher'",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Financial Quests",
      description:
        "Complete challenges like '30-day spending tracker' or 'Emergency fund builder'",
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Level Progression",
      description:
        "Advance from 'Financial Novice' to 'Money Master' as you improve your habits",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community Leaderboard",
      description:
        "Compare your financial health score with friends and community",
    },
  ];

  const subscriptionFeatures = [
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Subscription Manager",
      description:
        "Cancel unwanted subscriptions easily - track all recurring payments in one dashboard",
    },
    {
      icon: <AlertCircle className="h-6 w-6" />,
      title: "Recurring Payment Alerts", 
      description:
        "Get notified before renewals so you can cancel unused services and save money on recurring bills",
    },
    {
      icon: <PiggyBank className="h-6 w-6" />,
      title: "Smart Savings Tools",
      description:
        "AI finds duplicate subscriptions and suggests ways to improve your credit score with better budgeting",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Net Worth Tracker",
      description:
        "Monitor your financial progress with credit score monitoring and comprehensive net worth tracking",
    },
  ];

  const moneySavingFeatures = [
    {
      icon: <PiggyBank className="h-6 w-6" />,
      title: "Smart Savings Detector",
      description:
        "AI finds subscription duplicates, unused services, and overspending patterns automatically",
    },
    {
      icon: <AlertCircle className="h-6 w-6" />,
      title: "Spending Alerts",
      description:
        "Real-time notifications when you're approaching budget limits or unusual spending detected",
    },
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Money-Saving Tips",
      description:
        "Personalized recommendations based on your spending habits and financial goals",
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: "Cashback Optimizer",
      description:
        "Suggests best credit cards and cashback opportunities for your spending categories",
    },
  ];

  const aiFeatures = [
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Conversational AI",
      description:
        "Ask questions like 'How much did I spend on dining last month?' and get instant answers",
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Predictive Analytics",
      description:
        "AI predicts future cash flow, identifies spending trends, and suggests optimizations",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Auto-Categorization",
      description:
        "Machine learning automatically categorizes 95%+ of transactions with perfect accuracy",
    },
    {
      icon: <Timer className="h-6 w-6" />,
      title: "Real-time Insights",
      description:
        "Get instant financial insights as you spend with smart notifications and advice",
    },
  ];

  const advancedFeatures = [
    { icon: <Percent className="h-5 w-5" />, name: "Savings Rate Tracking" },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      name: "12-Month Trend Analysis",
    },
    {
      icon: <PieChart className="h-5 w-5" />,
      name: "Category Spending Breakdown",
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      name: "Monthly Budget vs Actual",
    },
    { icon: <Eye className="h-5 w-5" />, name: "Privacy Controls" },
    { icon: <Layers className="h-5 w-5" />, name: "Multi-Account Management" },
    {
      icon: <FileText className="h-5 w-5" />,
      name: "Transaction Search & Filter",
    },
    { icon: <DollarSign className="h-5 w-5" />, name: "Net Worth Calculation" },
    { icon: <Globe className="h-5 w-5" />, name: "Mobile-First Design" },
    { icon: <Lock className="h-5 w-5" />, name: "Bank-Level Security" },
    { icon: <Sparkles className="h-5 w-5" />, name: "Smart Notifications" },
    {
      icon: <CreditCard className="h-5 w-5" />,
      name: "Plaid Bank Integration",
    },
  ];

  return (
    <>
      <SEOHead
        title="BudgetHero - Level Up Your Money"
      />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        {/* Account Switch Notification */}
        {(isAccountSwitch || accountSwitchCookie) && (
          <div className="bg-green-600 text-white py-4 px-4 text-center sticky top-0 z-50 shadow-lg">
            <div className="flex items-center justify-center space-x-2">
              <User className="h-5 w-5" />
              <div className="font-medium">
                <div>
                  ✓ Account switched! You've been logged out completely.
                </div>
                <div className="text-sm mt-1 opacity-90">
                  {switchMethod === "cookies-cleared" ? (
                    <span>
                      All authentication cookies cleared! Click "Sign In" to use
                      a different email address.
                    </span>
                  ) : accountSwitchCookie ? (
                    <span>
                      Enhanced account switching enabled. Click "Sign In" to use
                      a different email address.
                    </span>
                  ) : (
                    <span>
                      Click "Sign In" below. If it shows the same account, try
                      clearing browser cookies or use incognito mode.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <header className="border-b bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link
              href="/"
              className="inline-block hover:opacity-80 transition-opacity"
            >
              <HeroShieldLogo size="lg" showText={true} showTagline={true} />
            </Link>

            <div className="flex items-center space-x-2 sm:space-x-4">
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
                variant="outline"
                onClick={handleLogin}
                className="border-gray-300 text-gray-800 bg-white hover:bg-gray-50 px-3 sm:px-4 text-sm sm:text-base font-medium landing-button-outline"
              >
                Sign In
              </Button>
              <Button
                onClick={handleLogin}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 text-sm sm:text-base"
              >
                <LogIn className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Get Started Free</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 opacity-80"></div>
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <Badge
              variant="secondary"
              className="mb-8 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 px-6 py-3 text-sm font-semibold shadow-lg animate-bounce"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              🎮 Gamified • 🤖 AI-Powered • 💡 Smart Money Saving
            </Badge>

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Best Budgeting App for
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
                Personal Finance
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Track monthly expenses easily • Manage subscriptions and bills in one app • Cancel unwanted subscriptions • Smart savings tools to improve your credit score
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-12 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 transform"
              >
                <Gamepad2 className="mr-3 h-7 w-7" />
                Start Your Journey
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-8 py-5 text-lg font-medium border-2 hover:bg-gray-50 group"
              >
                See How It Works
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">✨ Free 7-Day Trial</span>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">🔒 Bank-Level Security</span>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">🏦 11,000+ Banks Connected</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 text-purple-600 border-purple-200"
              >
                HOW IT WORKS
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                How to Track Monthly Expenses
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {" "}
                  Easily
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Simple expense tracking and subscription management - save money on recurring bills with our smart budgeting tools
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
              {[
                {
                  step: "1",
                  icon: <CreditCard className="h-8 w-8" />,
                  title: "Connect Your Banks",
                  description:
                    "Securely link your accounts in under 2 minutes. We support 11,000+ banks and credit unions.",
                },
                {
                  step: "2",
                  icon: <Brain className="h-8 w-8" />,
                  title: "AI Analyzes Everything",
                  description:
                    "Our AI automatically categorizes transactions, calculates your financial health score, and finds savings opportunities.",
                },
                {
                  step: "3",
                  icon: <Gamepad2 className="h-8 w-8" />,
                  title: "Start Playing & Learning",
                  description:
                    "Complete financial quests, earn achievement badges, and level up as you build better money habits.",
                },
                {
                  step: "4",
                  icon: <PiggyBank className="h-8 w-8" />,
                  title: "Watch Your Savings Grow",
                  description:
                    "Get personalized tips, automated alerts, and AI recommendations that help you save more every month.",
                },
              ].map((item, index) => (
                <div key={index} className="text-center group">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                      <div className="text-white">{item.icon}</div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors mobile-text-dark">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mobile-subtitle-dark">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Subscription Management */}
        <section className="py-20 bg-gradient-to-br from-slate-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 text-purple-600 border-purple-200"
              >
                SUBSCRIPTION MANAGER
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Manage Subscriptions & Bills
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {" "}
                  in One App
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Cancel unwanted subscriptions, save money on recurring bills, and improve your credit score with smart budgeting tools designed for millennials
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {subscriptionFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white"
                >
                  <CardHeader className="pb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="text-purple-600">
                        {feature.icon}
                      </div>
                    </div>
                    <CardTitle className="text-xl text-gray-900 font-bold mb-2">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Financial Planning for Millennials</h3>
              <p className="text-lg text-gray-600 mb-8">
                Our budgeting tools help you track monthly expenses easily and build better financial habits
              </p>
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 text-lg font-semibold"
              >
                Start Managing Subscriptions
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Main Features */}
        <section
          id="features"
          className="py-20 bg-gradient-to-br from-white to-purple-50"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <Badge
                variant="outline"
                className="mb-4 text-purple-600 border-purple-200"
              >
                CORE FEATURES
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Why BudgetHero is
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {" "}
                  Different
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                The only financial app that combines gaming, AI intelligence,
                and real bank data to make money management actually enjoyable
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {heroFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="border border-purple-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-white overflow-hidden group"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-6 group-hover:from-purple-200 group-hover:to-pink-200 transition-all duration-300">
                        <div className="text-purple-600 group-hover:text-purple-700 transition-colors duration-300">
                          {feature.icon}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 text-xs font-semibold"
                      >
                        {feature.highlight}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl text-gray-900 font-bold mb-3 group-hover:text-purple-900 transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-800 leading-relaxed text-lg font-medium">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Gamification Features */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 text-purple-600 border-purple-200"
              >
                🎮 GAMIFICATION
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Make Money Management
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {" "}
                  Actually Fun
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Turn every financial decision into a game where you level up,
                earn rewards, and compete with friends
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {gameFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border border-purple-100 bg-white"
                >
                  <CardHeader>
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <div className="text-white">{feature.icon}</div>
                    </div>
                    <CardTitle className="text-xl text-gray-900 font-bold mobile-text-dark">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-800 leading-relaxed font-medium mobile-subtitle-dark">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Money Saving Features */}
        <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 text-green-600 border-green-200"
              >
                💰 MONEY SAVING
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Save More Money
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {" "}
                  Automatically
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Our AI works 24/7 to find hidden savings opportunities and
                optimize your spending
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {moneySavingFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white border border-green-100"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <div className="text-white">{feature.icon}</div>
                      </div>
                      <CardTitle className="text-xl text-gray-900 mobile-text-dark">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed text-lg mobile-subtitle-dark">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* AI Assistant Features */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 text-blue-600 border-blue-200"
              >
                🤖 AI ASSISTANT
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Your Personal
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {" "}
                  Financial Advisor
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Advanced AI that understands your money patterns and provides
                personalized guidance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {aiFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white border border-blue-100"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                        <div className="text-white">{feature.icon}</div>
                      </div>
                      <CardTitle className="text-xl text-gray-900 mobile-text-dark">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed text-lg mobile-subtitle-dark">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Advanced Features Grid */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 text-gray-600 border-gray-200"
              >
                ADVANCED CAPABILITIES
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Professional-Grade Features
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Enterprise-level tools typically found only in expensive
                financial software
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {advancedFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm leading-tight mobile-text-dark">
                    {feature.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">
                Why People Choose BudgetHero
              </h2>
              <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
                Real benefits that make a difference in your financial life
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <TrendingUp className="h-12 w-12" />,
                  title: "Average 23% Spending Reduction",
                  description:
                    "Users save money by identifying and eliminating wasteful spending patterns",
                },
                {
                  icon: <Heart className="h-12 w-12" />,
                  title: "Less Financial Stress",
                  description:
                    "Gamification makes financial management enjoyable instead of overwhelming",
                },
                {
                  icon: <Target className="h-12 w-12" />,
                  title: "Achieve Goals Faster",
                  description:
                    "AI-powered insights and automated tracking accelerate financial progress",
                },
              ].map((benefit, index) => (
                <div key={index} className="text-center text-white">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                    {benefit.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
                  <p className="text-purple-100 leading-relaxed text-lg">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="flex justify-center items-center space-x-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-6 h-6 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                ⭐ Trusted by thousands of money heroes
              </p>
              <p className="text-gray-600 text-lg">
                Join the community that's leveling up their financial game every
                day
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              Ready to Become a
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Money Hero?
              </span>
            </h2>
            <p className="text-xl text-purple-100 mb-12 max-w-4xl mx-auto leading-relaxed">
              🎮 Play your way to financial success • 🤖 Get AI-powered money
              advice • 💰 Save more automatically • 📈 Track your financial
              health score
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                onClick={handleLogin}
                size="lg"
                variant="secondary"
                className="bg-white text-purple-600 hover:bg-gray-100 px-12 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 transform"
              >
                <Sparkles className="mr-3 h-6 w-6" />
                Start Your Hero Journey Free
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center space-x-8 mt-12 text-purple-100">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="font-medium">⚡ Setup in 2 minutes</span>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="font-medium">💎 No hidden fees</span>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="font-medium">🚀 Cancel anytime</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <HeroShieldLogo size="md" showText={true} showTagline={true} />
              <p className="text-gray-400 mt-6 max-w-2xl mx-auto">
                Transform your financial life with the power of gamification, AI
                intelligence, and real-time bank data. Join thousands who are
                already winning at money management.
              </p>
              <div className="mt-8 pt-8 border-t border-gray-800">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
                  <Link href="/privacy">
                    <Button
                      variant="link"
                      className="text-gray-400 hover:text-white text-sm p-0 h-auto"
                      data-testid="link-privacy-policy"
                    >
                      Privacy Policy
                    </Button>
                  </Link>
                </div>
                <p className="text-gray-500 text-sm">
                  © 2025 BudgetHero. All rights reserved. Built with 💜 for
                  your financial success.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
