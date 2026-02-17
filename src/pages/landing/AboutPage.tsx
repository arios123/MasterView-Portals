import { ArrowRight, Sparkles, Users, Target, TrendingUp, Heart, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AboutPage() {
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
                <Heart className="h-4 w-4" />
                About Us
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Built for the Interior Design Industry
              </h1>
              <p className="text-lg text-slate-200 max-w-3xl mx-auto">
                A family-owned and operated company, we&apos;ve spent over a year building MasterView Portals 
                through close collaboration with industry partners. Many drafts later, this is what we&apos;ve created.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Our Story
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  A family-owned business dedicated to making interior design professionals&apos; lives easier.
                </p>
              </div>

              <Card className="bg-white border-slate-200 mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Heart className="h-6 w-6 text-emerald-600" />
                    Family Owned & Operated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    MasterView Portals is a family-owned and operated company. This isn&apos;t just a business to us—it&apos;s 
                    a passion project born from understanding the real challenges interior design professionals face every day.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Being family-owned means we have the flexibility to truly listen to our users and respond quickly. 
                    We&apos;re not bound by corporate bureaucracy—we&apos;re driven by a genuine desire to build something 
                    that makes your work life better.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Clock className="h-6 w-6 text-emerald-600" />
                    Over a Year in the Making
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    We&apos;ve spent over a year building MasterView Portals to get to where we are today. This wasn&apos;t 
                    a rushed launch—it was a careful, deliberate process of working closely with our partners in the 
                    interior design industry.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Through many drafts, countless iterations, and continuous refinement, we&apos;ve shaped the platform 
                    into what it is today. Every feature, every workflow, and every detail has been thoughtfully considered 
                    and refined based on real-world feedback.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    This journey of continuous improvement continues today. We&apos;re always refining, always listening, 
                    and always working to make the platform better.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Approach Section */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Our Commitment to Excellence
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  We believe in continuous improvement and industry collaboration to build tools that truly matter.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <Card className="border-slate-200 h-full bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                      <Target className="h-6 w-6" />
                    </div>
                    <CardTitle>Constant Refinement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      We&apos;re always working to refine and improve every aspect of the platform. 
                      No feature is ever &quot;done&quot;—we continuously enhance based on real-world usage and feedback.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 h-full bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4">
                      <Users className="h-6 w-6" />
                    </div>
                    <CardTitle>Industry Partnerships</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      We maintain strong partnerships with leaders across the interior design industry. 
                      These relationships help us understand what professionals actually need day-to-day.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 h-full bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <CardTitle>Collaborative Development</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      Through consistent collaboration with our partners, we ensure every feature we build 
                      addresses real challenges and provides genuine value to interior design teams.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Approach Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                <Card className="bg-white border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-2xl">Refining Every Detail</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 leading-relaxed mb-4">
                      We&apos;re committed to refining our platform as much as possible. Every workflow, 
                      every feature, and every interaction is carefully considered and continuously improved. 
                      We don&apos;t settle for &quot;good enough&quot;—we strive for excellence in every detail.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      This means regular updates, performance optimizations, UX enhancements, and feature 
                      refinements based on how you actually use the platform. Your experience matters, 
                      and we&apos;re always working to make it better.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-2xl">Industry Partners & Collaboration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 leading-relaxed mb-4">
                      We have established partnerships within the interior design industry that we consistently 
                      collaborate with. These relationships are invaluable—they help us understand the real 
                      challenges interior design professionals face every day.
                    </p>
                    <p className="text-slate-700 leading-relaxed mb-4">
                      Our partners include design firms, renovation companies, material suppliers, and industry 
                      associations. Through regular dialogue and collaboration, we gain insights into:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li>Workflow pain points that need solving</li>
                      <li>Features that would genuinely improve productivity</li>
                      <li>Industry standards and best practices</li>
                      <li>Emerging trends and evolving needs</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-2xl">Features That Actually Help</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 leading-relaxed mb-4">
                      Because of our close collaboration with industry partners, we ensure that every feature 
                      we develop is actually helpful and needed in the interior design industry. We don&apos;t 
                      build features for the sake of having more features—we build solutions that solve real problems.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      This collaborative approach means you get a platform that understands your business. 
                      Every tool, every workflow, and every capability is designed with the interior design 
                      professional in mind, based on real-world feedback and industry expertise.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Custom Features Section */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white border-2 border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Mail className="h-6 w-6 text-emerald-600" />
                    We&apos;re Always Open to Your Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    As an interior design company, if you need something specific, we want to hear from you. 
                    We&apos;re always open to feedback and custom feature requests. Our goal is simple: 
                    <strong className="text-slate-900"> we&apos;re here to make your lives easier.</strong>
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-6">
                    If you have a specific need or an idea for a feature that would help your workflow, 
                    don&apos;t hesitate to reach out. Email us at{" "}
                    <a 
                      href="mailto:info@masterviewportals.com" 
                      className="text-emerald-600 hover:text-emerald-700 font-semibold underline"
                    >
                      info@masterviewportals.com
                    </a>
                    {" "}and we can go from there. We&apos;re happy to work on integrating new aspects 
                    that would benefit you and other interior design professionals.
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-slate-700 text-sm">
                      <strong className="text-emerald-900">Your feedback drives our development.</strong> 
                      {" "}Whether it&apos;s a small tweak or a major new feature, we take every request seriously 
                      and work with you to make it happen. That&apos;s the advantage of being a family-owned company—we 
                      can move quickly and prioritize what matters most to our users.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
                <CardHeader>
                  <CardTitle className="text-3xl mb-2">Experience the Difference</CardTitle>
                  <CardDescription className="text-slate-200 text-lg">
                    Join interior design teams who trust MasterView Portals to power their projects.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400" asChild>
                      <a href="/register">
                        Start your free trial
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

