import { useEffect } from "react";

interface StructuredDataProps {
  type?: 'WebApplication' | 'WebPage' | 'Organization';
  data?: any;
}

export function StructuredData({ type = 'WebApplication', data }: StructuredDataProps) {
  useEffect(() => {
    // Remove existing structured data script
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }

    let structuredData = {};

    if (type === 'WebApplication') {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "BudgetHero",
        "description": "Gamified personal finance management platform with AI-powered insights, bank integration, and smart budgeting tools.",
        "url": "https://budgethero.replit.app",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "featureList": [
          "Bank account integration",
          "AI-powered transaction categorization",
          "Budget management",
          "Financial health scoring",
          "Gamified experience",
          "Real-time spending alerts",
          "Transaction management",
          "Financial reports"
        ],
        "screenshot": "https://budgethero.replit.app/screenshot.png",
        "author": {
          "@type": "Organization",
          "name": "BudgetHero Team"
        },
        ...data
      };
    } else if (type === 'Organization') {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "BudgetHero",
        "url": "https://budgethero.replit.app",
        "logo": "https://budgethero.replit.app/logo.png",
        "description": "Gamified personal finance management platform helping users level up their money skills.",
        "sameAs": [],
        ...data
      };
    } else if (type === 'WebPage') {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": data?.title || "BudgetHero",
        "description": data?.description || "Level up your money with gamified personal finance management.",
        "url": window.location.href,
        "isPartOf": {
          "@type": "WebSite",
          "name": "BudgetHero",
          "url": "https://budgethero.replit.app"
        },
        ...data
      };
    }

    // Create and append new structured data script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      const scriptToRemove = document.querySelector('script[type="application/ld+json"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, data]);

  return null;
}