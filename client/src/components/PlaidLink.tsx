import { useCallback, useState, useEffect, ReactNode } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Loader2 } from "lucide-react";
import { PlaidConsentDialog } from "./plaid-consent-dialog";

interface PlaidLinkProps {
  onSuccess?: () => void;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
  className?: string;
  buttonText?: string;
  icon?: ReactNode;
}

export function PlaidLink({
  onSuccess,
  variant = "default",
  size = "default",
  className,
  buttonText = "Connect Bank Account",
  icon,
}: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [shouldOpenLink, setShouldOpenLink] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLinkTokenMutation = useMutation({
    mutationFn: async () => {
      console.log("Creating Plaid link token...");
      try {
        const response = await apiRequest("/api/plaid/link_token", "POST");
        const data = await response.json();
        console.log("Link token created successfully:", data);
        return data;
      } catch (error) {
        console.error("Link token creation failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Setting link token:", data.link_token);
      setLinkToken(data.link_token);
      setShouldOpenLink(true);
    },
    onError: (error: any) => {
      console.error("Link token mutation error:", error);
      const errorMessage = error.message || "Failed to create link token";
      toast({
        title: "Connection Error",
        description: `Unable to connect to Plaid: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const exchangeTokenMutation = useMutation({
    mutationFn: async (public_token: string) => {
      console.log("Exchanging public token...");
      try {
        const response = await apiRequest("/api/plaid/exchange_public_token", "POST", {
          public_token,
        });
        const data = await response.json();
        console.log("Token exchange successful:", data);
        return data;
      } catch (error) {
        console.error("Token exchange failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Account linking successful:", data);
      // Invalidate all relevant queries to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/categories"] });
      toast({
        title: "Success!",
        description: `Successfully linked ${data.length || 1} account(s) and imported transactions`,
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Exchange token mutation error:", error);
      const errorMessage = error.message || "Failed to link accounts";
      toast({
        title: "Account Linking Error",
        description: `Unable to link your bank account: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const onSuccessCallback = useCallback(
    (public_token: string, metadata: any) => {
      exchangeTokenMutation.mutate(public_token);
    },
    [exchangeTokenMutation]
  );

  const onExitCallback = useCallback((err: any, metadata: any) => {
    if (err) {
      console.error("Plaid Link error:", err);
      toast({
        title: "Link Error",
        description: "Failed to connect your bank account",
        variant: "destructive",
      });
    }
  }, [toast]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onSuccessCallback,
    onExit: onExitCallback,
  });

  // Auto-open Link when token is ready
  useEffect(() => {
    if (shouldOpenLink && linkToken && ready) {
      setShouldOpenLink(false);
      open();
    }
  }, [shouldOpenLink, linkToken, ready, open]);

  const handleClick = () => {
    // Show consent dialog first
    setShowConsentDialog(true);
  };

  const handleConsent = () => {
    // User has consented, proceed with bank connection
    if (linkToken && ready) {
      open();
    } else if (!createLinkTokenMutation.isPending) {
      createLinkTokenMutation.mutate();
    }
  };

  const handleConsentCancel = () => {
    // User cancelled consent - show a toast
    toast({
      title: "Connection Cancelled",
      description: "You must agree to data collection to connect your bank account.",
      variant: "default",
    });
  };

  const isLoading = createLinkTokenMutation.isPending || exchangeTokenMutation.isPending;

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading || (!ready && !!linkToken)}
        variant={variant}
        size={size}
        className={className}
        data-testid="button-connect-bank"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : icon ? (
          <>
            {icon}
            {buttonText && <span className="ml-2">{buttonText}</span>}
          </>
        ) : (
          <>
            <Building2 className="mr-2 h-4 w-4" />
            {buttonText}
          </>
        )}
      </Button>

      <PlaidConsentDialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        onConsent={handleConsent}
        onCancel={handleConsentCancel}
      />
    </>
  );
}