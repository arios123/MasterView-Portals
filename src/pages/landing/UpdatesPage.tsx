import { ArrowRight, Sparkles, Calendar, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function UpdatesPage() {
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
                Product Updates
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                What&apos;s Coming Next
              </h1>
              <p className="text-lg text-slate-200 max-w-3xl mx-auto">
                Stay up to date with the latest features and improvements we&apos;re building for the interior design industry.
              </p>
            </div>
          </div>
        </section>

        {/* Latest Update Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <Card className="border-2 border-emerald-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Rocket className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Launching Soon by 2026</CardTitle>
                      <CardDescription className="text-base mt-1">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        December 2024
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-700 leading-relaxed text-lg">
                    We&apos;re excited to announce that MasterView Portals will be launching soon, with a target launch date by 2026. 
                    Our team is working hard through the holidays to bring you a platform that truly serves the interior design industry.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    We understand how important it is to have the right tools when you need them most. That&apos;s why we&apos;re 
                    pushing forward during this holiday season—we want to help out the industry as fast as possible so that 
                    MasterView Portals is ready when everyone comes back from the holidays.
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-6">
                    <p className="text-slate-700 text-sm">
                      <strong className="text-emerald-900">Our commitment:</strong> We&apos;re dedicated to delivering a 
                      platform that makes your work life easier, and we&apos;re not slowing down. Stay tuned for more updates 
                      as we get closer to launch.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
                <CardHeader>
                  <CardTitle className="text-3xl mb-2">Be the First to Know</CardTitle>
                  <CardDescription className="text-slate-200 text-lg">
                    Sign up to get notified when we launch and stay updated on new features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400" asChild>
                      <a href="/register">
                        Get notified
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20" asChild>
                      <a href="/product/galaxy-of-features">Explore features</a>
                    </Button>
                  </div>
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
