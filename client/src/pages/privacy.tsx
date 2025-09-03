import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/seo-head";
import { ArrowLeft, Shield, Lock, Eye, Users, Mail, FileText } from "lucide-react";

export default function Privacy() {
  return (
    <>
      <SEOHead 
        title="Privacy Policy | BudgetHero"
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: August 15, 2025</p>
            </div>
          </div>
        </div>

        {/* Privacy Policy Content */}
        <div className="space-y-6">
          {/* Overview Card */}
          <Card className="border-purple-200 dark:border-purple-800" data-testid="card-privacy-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Eye className="h-5 w-5" />
                Your Privacy Matters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                At BudgetHero, we're committed to protecting your privacy and ensuring the security of your financial data. 
                This policy explains how we collect, use, and safeguard your information.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card data-testid="card-information-collected">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                1. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                BudgetHero collects financial information and related data through Plaid to provide budgeting and 
                financial management services. This data may include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Bank account information</li>
                <li>Transaction history</li>
                <li>Account balances</li>
                <li>Account names and types</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card data-testid="card-information-usage">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                2. How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                We use your information solely to deliver and improve BudgetHero's features and services. 
                Your data helps us provide accurate budgeting, track spending, and offer personalized insights 
                to help you achieve your financial goals.
              </p>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card data-testid="card-data-sharing">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                3. Data Sharing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                We do not share your personal financial information with third parties, except as necessary 
                to operate BudgetHero and comply with legal obligations. Plaid acts as a secure intermediary 
                to retrieve your financial data with your explicit consent.
              </p>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card data-testid="card-data-security">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" />
                4. Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                We take the security of your data seriously. BudgetHero employs multiple layers of protection:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Encryption in transit (TLS 1.2+) and at rest</li>
                <li>Multi-factor authentication on critical systems</li>
                <li>Regular security assessments and monitoring</li>
                <li>Secure data handling practices</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                These measures protect your information from unauthorized access, disclosure, or misuse.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card data-testid="card-user-rights">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                5. Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                You have the right to request access, correction, or deletion of your personal data. 
                To exercise these rights, please contact us at:{" "}
                <a 
                  href="mailto:support@budgetheroapp.com" 
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline"
                  data-testid="link-support-email"
                >
                  support@budgetheroapp.com
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card data-testid="card-contact-us">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                6. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                If you have any questions about this privacy policy or our data practices, please reach out at:{" "}
                <a 
                  href="mailto:support@budgetheroapp.com" 
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline"
                  data-testid="link-contact-email"
                >
                  support@budgetheroapp.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 BudgetHero. All rights reserved.
            </p>
            <Link href="/">
              <Button data-testid="button-return-home">
                Return to BudgetHero
              </Button>
            </Link>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}