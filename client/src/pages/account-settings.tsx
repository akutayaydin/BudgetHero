import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarSelection } from "@/components/avatar-selection";
import { 
  User, 
  Mail, 
  Shield, 
  Save, 
  Camera,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  username: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
}

export default function AccountSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);

  // Fetch current user data
  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/auth/user"],
  });

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  });

  // Update form data when user data loads
  useEffect(() => {
    if (user) {
      const nameParts = user.name?.split(' ') || [];
      setFormData({
        firstName: user.firstName || nameParts[0] || "",
        lastName: user.lastName || nameParts.slice(1).join(' ') || "",
      });
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Updated",
        description: "Your name has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getUserInitials = () => {
    if (formData.firstName || formData.lastName) {
      return `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 pt-16 md:pt-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 pt-16 md:pt-6 bg-background min-h-full">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Update your personal information and display name.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter your first name"
                      disabled={updateProfileMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter your last name"
                      disabled={updateProfileMutation.isPending}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Information (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
              <CardDescription>
                Your account details and authentication information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email Address</Label>
                  <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Username</Label>
                  <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user?.username}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Email and username cannot be changed. Contact support if you need assistance.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Preview & Avatar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Profile Picture</span>
              </CardTitle>
              <CardDescription>
                Your avatar and display information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-lg font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center">
                  <p className="font-medium">
                    {formData.firstName || formData.lastName 
                      ? `${formData.firstName} ${formData.lastName}`.trim() 
                      : "No name set"}
                  </p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAvatarSelection(true)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Change Avatar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Profile Complete</span>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {formData.firstName && formData.lastName ? "100%" : "80%"}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-sm font-medium">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Avatar Selection Modal */}
      {showAvatarSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <AvatarSelection />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowAvatarSelection(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}