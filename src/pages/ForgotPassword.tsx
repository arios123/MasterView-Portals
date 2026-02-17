import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Missing Information",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      // Show success state
      setEmailSent(true);
      
      toast({
        title: "Email Sent",
        description: "If an account exists with this email, you will receive password reset instructions.",
      });
    } catch (error: any) {
      let errorMessage = "An error occurred while sending the reset email";
      
      if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      
      <Card className="w-full max-w-md rounded-2xl border border-[#cfcfcf] bg-white shadow-smooth-lg relative z-10">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-[#0B294b]">
            {emailSent ? "Check your email" : "Reset your password"}
          </CardTitle>
          <p className="text-[#617b5d] mt-2 text-sm">
            {emailSent 
              ? "We've sent password reset instructions to your email address."
              : "Enter your email and we'll send you a secure link to reset your password."
            }
          </p>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-emerald-500/20 p-4">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-[#0B294b]">
                  An email has been sent to <strong className="font-semibold">{email}</strong>
                </p>
                <p className="text-sm text-[#8b8b8b]">
                  Please check your inbox and follow the instructions to reset your password.
                  The link will expire in 1 hour.
                </p>
              </div>
              <div className="space-y-2 pt-4">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full rounded-xl bg-[#2b8ac4] text-white hover:bg-[#46b7d7] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Back to Sign In
                </Button>
                <Button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  variant="outline"
                  className="w-full rounded-xl border-[#cfcfcf] text-[#0B294b] bg-white hover:bg-[#e7ebed]"
                >
                  Send Another Email
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#0B294b]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl bg-white border-[#cfcfcf] text-[#0B294b] placeholder:text-[#8b8b8b] focus:border-[#2b8ac4] focus-visible:ring-[#2b8ac4]"
                  disabled={loading}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl bg-[#2b8ac4] text-white hover:bg-[#46b7d7] transition-all duration-200 shadow-sm hover:shadow-md"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Button
                type="button"
                onClick={() => navigate("/login")}
                variant="ghost"
                className="w-full rounded-xl text-[#617b5d] hover:text-[#0B294b] hover:bg-[#e7ebed]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
