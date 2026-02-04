"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import Avatar from "@/components/elements/Avatar";
import { authClient } from "@/lib/auth-client";
import { Shield, User, Bell, Users, LogOut, Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createAuthClient } from "better-auth/react";
const { useSession } = createAuthClient();

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user;

  // Form State
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sync state when session loads
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  // Handle Loading State
  if (isPending) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirect if no session
  if (!session) {
    router.push("/auth/login" as any);
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Better-Auth update call example
    await authClient.updateUser({
        name: name,
    }, {
        onSuccess: () => {
            setIsLoading(false);
            // Add toast notification here if you have one
        },
        onError: (ctx) => {
            setIsLoading(false);
            alert(ctx.error.message);
        }
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/login" as any);
        },
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Account</h2>
          <p className="text-sm text-muted-foreground">Manage your account settings and preferences.</p>
        </div>
        <Button 
          variant="outline" 
          className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" 
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
      
      <Separator className="my-6" />

      <Tabs defaultValue="general" className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
        <aside className="md:w-1/4 lg:w-1/5 shrink-0">
          <TabsList className="flex flex-col w-full justify-start h-auto p-0 bg-transparent gap-1">
            <TabsTrigger value="general" className="w-full justify-start px-3 py-2 h-9 font-normal data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted/50 rounded-md transition-colors">
              <User className="mr-2 h-4 w-4" /> General
            </TabsTrigger>
            <TabsTrigger value="security" className="w-full justify-start px-3 py-2 h-9 font-normal data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted/50 rounded-md transition-colors">
              <Shield className="mr-2 h-4 w-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="teams" className="w-full justify-start px-3 py-2 h-9 font-normal data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted/50 rounded-md transition-colors">
              <Users className="mr-2 h-4 w-4" /> Teams
            </TabsTrigger>
            <TabsTrigger value="notifications" className="w-full justify-start px-3 py-2 h-9 font-normal data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted/50 rounded-md transition-colors">
              <Bell className="mr-2 h-4 w-4" /> Notifications
            </TabsTrigger>
          </TabsList>
        </aside>

        <div className="flex-1 lg:max-w-2xl">
          <TabsContent value="general" className="space-y-6 m-0">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group cursor-pointer">
                    <Avatar 
                      src={user?.image || undefined} 
                      username={user?.name || "User"} 
                      className="!w-20 !h-20"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium leading-none">Profile Picture</h4>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Click on the avatar to upload a custom image.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 text-xs h-8">
                      Upload new image
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Your name" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={user?.email || ""} 
                      disabled 
                      className="bg-muted cursor-not-allowed opacity-100" 
                    />
                    <p className="text-[0.8rem] text-muted-foreground">
                      Email addresses are managed through your identity provider.
                    </p>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 bg-muted/25 flex justify-end">
                <Button type="submit" form="profile-form" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Saving..." : "Save changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ... other TabsContent sections ... */}
        </div>
      </Tabs>
    </div>
  );
}