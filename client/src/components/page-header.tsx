import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SEOHead } from "./seo-head";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  description?: string;
  keywords?: string;
}

export function PageHeader({ 
  title, 
  subtitle, 
  children, 
  className,
  description,
  keywords
}: PageHeaderProps) {
  const fullTitle = `${title} | BudgetHero - Level Up Your Money`;
  const seoDescription = description || subtitle || `${title} page on BudgetHero - your personal finance management platform`;

  return (
    <>
      <SEOHead 
        title={fullTitle}
        description={seoDescription}
        keywords={keywords}
        canonical={window.location.href}
      />
      <div className={cn("bg-card border-b border-border p-4 sm:p-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
      </div>
    </>
  );
}