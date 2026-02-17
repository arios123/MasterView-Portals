import { useState, useEffect } from "react";
import { Mail, HelpCircle, CreditCard, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserById } from "@/queries/users";

/**
 * Support Tab for authenticated portal users
 * Same content as landing page Support but integrated into portal layout
 */
export function SupportTab() {
  const { user } = useAuth();
  const [form, setForm] = useState({ 
    recipient: "support", 
    name: "", 
    email: "", 
    subject: "", 
    message: "" 
  });
  const [loading, setLoading] = useState(false);

  // Load user info if authenticated
  useEffect(() => {
    if (user) {
      fetchUserById(user.id).then((userData) => {
        setForm(prev => ({
          ...prev,
          name: userData?.name || "",
          email: userData?.email || ""
        }));
      }).catch(() => {
        // Silently fail - user can fill manually
      });
    }
  }, [user]);

  const recipientEmails = {
    support: "support@masterviewportals.com",
    billing: "billing@masterviewportals.com",
    info: "info@masterviewportals.com",
    other: "info@masterviewportals.com"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const email = recipientEmails[form.recipient as keyof typeof recipientEmails];
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Reset form after a brief delay
    setTimeout(() => {
      setForm(prev => ({
        ...prev,
        subject: "",
        message: ""
      }));
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-lg">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute w-64 h-64 bg-emerald-400/30 blur-3xl rounded-full -top-10 -left-10" />
          <div className="absolute w-80 h-80 bg-cyan-400/25 blur-3xl rounded-full bottom-0 right-10" />
        </div>
        <div className="relative z-10 p-8 md:p-12">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-semibold border border-white/10 mb-4">
              <HelpCircle className="h-4 w-4" />
              Support
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              We&apos;re Here to Help
            </h1>
            <p className="text-lg text-slate-200">
              Have questions, need assistance, or want to share feedback? Reach out to us through email or use the form below.
            </p>
          </div>
        </div>
      </div>

      {/* Email Information Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <HelpCircle className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Support & Bug Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm mb-3">
              If you have any questions or need to report bugs, email us at:
            </p>
            <a 
              href="mailto:support@masterviewportals.com" 
              className="text-emerald-600 hover:text-emerald-700 font-semibold underline text-sm"
            >
              support@masterviewportals.com
            </a>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Billing Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm mb-3">
              If you have billing questions, you can also email:
            </p>
            <a 
              href="mailto:billing@masterviewportals.com" 
              className="text-emerald-600 hover:text-emerald-700 font-semibold underline text-sm"
            >
              billing@masterviewportals.com
            </a>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Say Hi or Feature Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm mb-3">
              If you just want to say hi or have feature requests, email:
            </p>
            <a 
              href="mailto:info@masterviewportals.com" 
              className="text-emerald-600 hover:text-emerald-700 font-semibold underline text-sm"
            >
              info@masterviewportals.com
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <p className="text-slate-700 text-sm">
          <strong className="text-emerald-900">Or use the form below</strong> to send us a message. 
          You can select which department to contact, or fill out the boxes and we&apos;ll route your message appropriately.
        </p>
      </div>

      {/* Contact Form Section */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl">Send Us a Message</CardTitle>
          <CardDescription>
            Fill out the form below and we&apos;ll get back to you as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Send to</Label>
              <Select
                value={form.recipient}
                onValueChange={(value) => setForm({ ...form, recipient: value })}
              >
                <SelectTrigger id="recipient">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">Support & Bug Reports</SelectItem>
                  <SelectItem value="billing">Billing Questions</SelectItem>
                  <SelectItem value="info">General Inquiry / Feature Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={6}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400" disabled={loading}>
              {loading ? "Opening email..." : "Send Message"}
              <Mail className="h-4 w-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

