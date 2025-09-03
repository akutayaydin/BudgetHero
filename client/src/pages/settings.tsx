
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/ThemeContext";
import { AvatarSelection } from "@/components/avatar-selection";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Shield, ExternalLink } from "lucide-react";
import { NotificationSettings } from "../components/notification-settings";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl space-y-6">
          {/* Profile Settings */}
          {user && (
            <AvatarSelection
              currentAvatar={user.avatar}
              userInitials={getUserInitials()}
              onAvatarChange={(avatarUrl) => {
                // Avatar change will be handled by the component and React Query cache invalidation
                console.log('Avatar updated:', avatarUrl);
              }}
            />
          )}
          {/* Notification Settings */}
          <NotificationSettings />

          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Input id="currency" defaultValue="USD" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Input id="dateFormat" defaultValue="MM/DD/YYYY" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Toggle dark mode theme</p>
                </div>
                <Switch 
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive weekly summary emails</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Export Data</h4>
                <p className="text-sm text-muted-foreground mb-4">Download all your financial data</p>
                <Button variant="outline">Export All Data</Button>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2 text-red-600">Danger Zone</h4>
                <p className="text-sm text-muted-foreground mb-4">Permanently delete all your data</p>
                <Button variant="destructive">Delete All Data</Button>
              </div>
            </CardContent>
          </Card>

          {/* Legal & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Legal & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Privacy Policy</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Review how we collect, use, and protect your financial data
                </p>
                <Link href="/privacy">
                  <Button variant="outline" className="flex items-center gap-2" data-testid="button-view-privacy-policy">
                    <Shield className="h-4 w-4" />
                    View Privacy Policy
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Data Protection</h4>
                <p className="text-sm text-muted-foreground">
                  Your financial data is encrypted and protected with bank-level security. 
                  We never share your personal information with third parties without your consent.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
