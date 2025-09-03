import { useEffect } from "react";
import { StructuredData } from "./structured-data";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  structuredData?: any;
}

export function SEOHead({
  title = "BudgetHero - Subscription Manager & Expense Tracker | Level Up Your Money",
  description = "Best budgeting app for personal finance. Track monthly expenses easily, manage subscriptions and bills in one app, cancel unwanted subscriptions, and improve your credit score with smart savings tools.",
  keywords = "subscription manager, expense tracker, budgeting apps for personal finance, track monthly expenses easily, cancel unwanted subscriptions, recurring payments, smart savings, credit score monitoring, net worth tracker, financial planning for millennials, manage subscriptions and bills",
  canonical,
  ogImage = "/og-image.png",
  noIndex = false,
  structuredData
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    // Update standard meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    
    // Update Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:url', window.location.href, true);
    
    // Update Twitter tags
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', ogImage, true);
    updateMetaTag('twitter:url', window.location.href, true);
    
    // Update canonical URL
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }
  }, [title, description, keywords, canonical, ogImage, noIndex]);

  return (
    <>
      <StructuredData type="WebPage" data={{ title, description }} />
      {structuredData && <StructuredData {...structuredData} />}
    </>
  );
}