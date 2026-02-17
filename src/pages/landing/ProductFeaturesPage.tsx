import { ArrowRight, Sparkles, ShieldCheck, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { features } from "./Features";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ProductFeaturesPage() {
  return (
    <div className="min-h-screen bg-white animate-fade-in-up">
      <HeaderLinks />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute w-64 h-64 bg-emerald-400/30 blur-3xl rounded-full -top-10 -left-10" />
            <div className="absolute w-80 h-80 bg-cyan-400/25 blur-3xl rounded-full bottom-0 right-10" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
            <div className="max-w-4xl">
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-semibold border border-white/10 mb-4">
                <Sparkles className="h-4 w-4" />
                Galaxy of Features
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                The complete operating system for design & renovation teams
              </h1>
              <p className="text-lg text-slate-200 max-w-3xl mb-8">
                From quoting to client approvals to final payment, every step lives in one cohesive portal. Ship faster, keep clients informed, and give your team the clarity they need.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400" asChild>
                  <a href="/register">
                    Start free trial
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="bg-white text-slate-900 border-white/30 hover:bg-slate-900 hover:text-white" asChild>
                  <a href="/login">Sign in</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-slate-200 h-full">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <Workflow className="h-5 w-5" />
                  </div>
                  <CardTitle>Project OS</CardTitle>
                  <CardDescription>Quotes, schedules, change orders, documents, and payments all stay linked to each project.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-slate-200 h-full">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center mb-3">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <CardTitle>Client-grade portal</CardTitle>
                  <CardDescription>Lookbooks, approvals, timelines, and updates in a clean, branded experience your clients love.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-slate-200 h-full">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <CardTitle>Role-based control</CardTitle>
                  <CardDescription>Fine-grained permissions for designers, PMs, finance, vendors, and clients—keep sensitive data protected.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-10 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-emerald-600 mb-2">Feature deep dive</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything your team needs</h2>
              <p className="text-slate-600 max-w-2xl mx-auto mt-3">
                Purpose-built workflows for renovation and design—from first estimate to project handoff.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={index}
                    className="border-slate-200 hover:border-emerald-200 transition-all duration-200 hover:shadow-lg bg-white"
                  >
                    <CardHeader>
                      <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                        <Icon className="h-5 w-5 text-emerald-700" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-slate-600 text-sm">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white px-8 py-10 md:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
              <div>
                <p className="text-sm font-semibold text-emerald-300 mb-2">Ready to launch?</p>
                <h3 className="text-2xl md:text-3xl font-bold mb-2">Onboard your team in minutes</h3>
                <p className="text-slate-200 max-w-2xl">
                  Invite your crew, set roles, and import projects. Your client-facing portal is ready on day one.
                </p>
              </div>
              <div className="flex gap-3">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400" asChild>
                  <a href="/register">
                    Get started
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="bg-white text-slate-900 border-white/30 hover:bg-slate-900 hover:text-white" asChild>
                  <a href="/login">Sign in</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


