import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, HelpCircle, CreditCard, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

export default function SupportPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to portal support
  useEffect(() => {
    if (!loading && user) {
      navigate("/internalsupport", { replace: true });
    }
  }, [user, loading, navigate]);
  const [form, setForm] = useState({ 
    recipient: "support", 
    name: "", 
    email: "", 
    subject: "", 
    message: "" 
  });

  const recipientEmails = {
    support: "support@masterviewportals.com",
    billing: "billing@masterviewportals.com",
    info: "info@masterviewportals.com",
    other: "info@masterviewportals.com"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = recipientEmails[form.recipient as keyof typeof recipientEmails];
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailtoLink;
  };

  // Show loading while checking auth, or nothing if redirecting
  if (loading || user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white animate-fade-in-up">
      <HeaderLinks />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute w-64 h-64 bg-emerald-400/30 blur-3xl rounded-full -top-10 -left-10" />
            <div className="absolute w-80 h-80 bg-cyan-400/25 blur-3xl rounded-full bottom-0 right-10" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-semibold border border-white/10 mb-4">
                <HelpCircle className="h-4 w-4" />
                Support
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                We&apos;re Here to Help
              </h1>
              <p className="text-lg text-slate-200 max-w-3xl mx-auto">
                Have questions, need assistance, or want to share feedback? Reach out to us through email or use the form below.
              </p>
            </div>
          </div>
        </section>

        {/* Email Information Section */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <Card className="border-slate-200 bg-white">
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

                <Card className="border-slate-200 bg-white">
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

                <Card className="border-slate-200 bg-white">
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

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-8">
                <p className="text-slate-700 text-sm">
                  <strong className="text-emerald-900">Or use the form below</strong> to send us a message. 
                  You can select which department to contact, or fill out the boxes and we&apos;ll route your message appropriately.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
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
                    <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400">
                      Send Message
                      <Mail className="h-4 w-4 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
