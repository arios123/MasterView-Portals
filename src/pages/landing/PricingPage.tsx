import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PricingPage() {
  const monthlyPrice = 200;
  const yearlyPrice = 2000;
  const monthlyYearlyTotal = monthlyPrice * 12; // $2400
  const yearlySavings = monthlyYearlyTotal - yearlyPrice; // $400
  const savingsPercentage = Math.round((yearlySavings / monthlyYearlyTotal) * 100); // ~17%

  const features = [
    "Unlimited projects and clients",
    "Full quote builder with templates",
    "Project calendar and scheduling",
    "Payment tracking and management",
    "Client lookbooks and approvals",
    "Materials and inventory management",
    "Change order tracking",
    "Document templates and storage",
    "Custom roles & permissions",
    "Team collaboration tools",
    "Client portal access",
    "Priority support"
  ];

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
                <Sparkles className="h-4 w-4" />
                Simple, Fair Pricing
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                One Premium Package for Everyone
              </h1>
              <p className="text-lg text-slate-200 max-w-3xl mx-auto mb-8">
                We believe in equality. Every team gets the same powerful features, 
                the same unlimited access, and the same premium experience—no tiers, no limits, no confusion.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Monthly Plan */}
                <Card className="border-2 border-slate-200 hover:border-emerald-300 transition-all">
                  <CardHeader>
                    <CardTitle className="text-2xl">Monthly</CardTitle>
                    <CardDescription className="text-base mt-2">
                      Perfect for trying us out
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-5xl font-bold text-slate-900">${monthlyPrice}</span>
                      <span className="text-slate-600 ml-2">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      size="lg" 
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white mb-6" 
                      asChild
                    >
                      <a href="/register">
                        Try for free
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </a>
                    </Button>
                    <ul className="space-y-3">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Yearly Plan */}
                <Card className="border-2 border-emerald-500 relative hover:border-emerald-600 transition-all shadow-lg">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Save {savingsPercentage}%
                    </span>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl">Yearly</CardTitle>
                    <CardDescription className="text-base mt-2">
                      Best value for growing teams
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-5xl font-bold text-slate-900">${yearlyPrice}</span>
                      <span className="text-slate-600 ml-2">/year</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                      Just ${Math.round(yearlyPrice / 12)}/month
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      size="lg" 
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-white mb-6" 
                      asChild
                    >
                      <a href="/register">
                        Try for free
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </a>
                    </Button>
                    <ul className="space-y-3">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Free Trial & Cancellation Section */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Start with a Free Trial
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Test all features risk-free for one month. No credit card required to start. 
                If you don&apos;t love it, cancel anytime—no questions asked, no hassle.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl">Free Trial</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      Full access to all features for 30 days. Explore everything we offer with zero commitment.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl">Easy Cancellation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      Cancel anytime from your account settings. No phone calls, no sales pitches—just a simple click.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Button 
                size="lg" 
                className="bg-emerald-500 hover:bg-emerald-400 text-white text-lg px-8 py-6" 
                asChild
              >
                <a href="/register">
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>What&apos;s included in the free trial?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      Everything. You get full access to all features, unlimited projects, and all premium capabilities during your 30-day trial period.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Can I switch between monthly and yearly?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      Yes, you can change your billing cycle at any time from your account settings. Changes take effect on your next billing date.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>What happens if I cancel?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      You&apos;ll continue to have access until the end of your current billing period. After that, your account will be paused, and you can reactivate anytime.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Do you offer refunds?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      We offer a 30-day free trial so you can test everything risk-free. If you&apos;re not satisfied within the first 30 days of paid subscription, contact us for a full refund.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

