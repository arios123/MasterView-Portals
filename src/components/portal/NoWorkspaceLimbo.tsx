import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function NoWorkspaceLimbo() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 relative">
      {/* Sign Out Button - Top Right */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-slate-600 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-slate-600" />
          </div>
          <CardTitle className="text-2xl">No Workspace Access</CardTitle>
          <CardDescription className="mt-2">
            You're not currently part of any workspace. Please contact your employer to get added to their workspace, or create a new workspace to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={() => navigate('/register')}
          >
            <Plus className="h-4 w-4" />
            Create a New Workspace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

