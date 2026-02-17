import { Shield, Lock, Database, HardDrive, RefreshCw, Eye, Server } from "lucide-react";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SecurityPage() {
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
                <Shield className="h-4 w-4" />
                Security
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your Data, Protected
              </h1>
              <p className="text-lg text-slate-200 max-w-3xl mx-auto">
                We take security seriously. Your data is protected by enterprise-grade security measures, 
                carefully crafted access controls, and comprehensive backup strategies.
              </p>
            </div>
          </div>
        </section>

        {/* Security Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Enterprise-Grade Security Infrastructure
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Our security architecture employs multiple layers of protection to ensure your data remains secure and accessible only to authorized users.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-12">
                <Card className="border-slate-200 bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                      <Lock className="h-6 w-6" />
                    </div>
                    <CardTitle>End-to-End Encryption</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      All data in transit is protected by industry-standard TLS 1.3 encryption protocols. 
                      Data at rest is encrypted using AES-256 encryption, ensuring that even in the event of 
                      physical access to storage systems, your information remains unreadable.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4">
                      <Database className="h-6 w-6" />
                    </div>
                    <CardTitle>Row-Level Security Policies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      Our database implements hand-crafted Row-Level Security (RLS) policies that have been 
                      meticulously reviewed and tested multiple times. Each policy is manually audited to ensure 
                      that users can only access data they are authorized to view, with granular permission controls 
                      at the database level.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                      <Server className="h-6 w-6" />
                    </div>
                    <CardTitle>Network Isolation & Firewall Protection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      Our infrastructure operates behind advanced network firewalls with strict ingress and egress 
                      rules. Database connections are isolated within private networks, and all external access is 
                      routed through secure, encrypted connection pools with automatic DDoS mitigation and rate limiting.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                      <Eye className="h-6 w-6" />
                    </div>
                    <CardTitle>Comprehensive Audit Logging</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      Every database operation, authentication attempt, and access request is logged with detailed 
                      metadata including timestamps, user identifiers, and action types. This comprehensive audit 
                      trail enables rapid security incident detection and forensic analysis.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Data Protection & Backups Section */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Data Protection & Backup Strategy
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  We employ a multi-layered backup strategy to ensure your data is always recoverable.
                </p>
              </div>

              <div className="space-y-6">
                <Card className="bg-white border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <HardDrive className="h-6 w-6 text-emerald-600" />
                      Off-Grid Local Storage Backups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 leading-relaxed mb-4">
                      In addition to cloud-based backups, we maintain encrypted backups on local storage systems 
                      that are completely off the grid. These air-gapped backups provide an additional layer of 
                      protection against network-based threats and ensure data recovery capabilities even in the 
                      event of widespread infrastructure issues.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      These off-grid backups are stored in physically secure locations with restricted access, 
                      ensuring that your data remains protected from both digital and physical threats.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <RefreshCw className="h-6 w-6 text-emerald-600" />
                      Weekly Automated Backup Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 leading-relaxed mb-4">
                      We perform comprehensive database backups every week to ensure good rollback capabilities 
                      in case of emergencies. These automated backups capture the complete state of your data, 
                      including all tables, relationships, and configurations.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      Our backup retention policy maintains multiple restore points, allowing us to roll back to 
                      any point in time within the retention window. This ensures that even if data corruption or 
                      accidental deletion occurs, we can quickly restore your workspace to a previous state with 
                      minimal data loss.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Commitment Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
                <CardHeader>
                  <CardTitle className="text-3xl mb-2 flex items-center gap-3">
                    <Shield className="h-8 w-8" />
                    Our Privacy Commitment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-200 leading-relaxed mb-4 text-lg">
                    We do not have any interest in selling your information. Period.
                  </p>
                  <p className="text-slate-200 leading-relaxed mb-4">
                    We understand the importance of data privacy because we value our own privacy. We don&apos;t like 
                    our information leaked, and we would never expect anything less from our customers. Your data 
                    belongs to you, and we treat it with the same respect and protection we expect for our own.
                  </p>
                  <p className="text-slate-200 leading-relaxed">
                    Your information is used solely to provide you with the services you&apos;ve requested. We don&apos;t 
                    share, sell, or monetize your data in any way. This isn&apos;t just a policy—it&apos;s a fundamental 
                    principle that guides everything we do.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Additional Security Features */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Additional Security Measures
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Beyond encryption and backups, we implement additional security layers to protect your data.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-white border-slate-200">
                  <CardHeader>
                    <CardTitle>Role-Based Access Control (RBAC)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      Fine-grained permission systems ensure that users only have access to the features and data 
                      they need. Permissions are enforced at both the application and database levels, providing 
                      defense in depth.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                  <CardHeader>
                    <CardTitle>Secure Authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      We support secure authentication protocols including OAuth 2.0, JWT tokens with short expiration 
                      times, and optional multi-factor authentication. All authentication flows use encrypted channels 
                      and follow industry best practices.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                  <CardHeader>
                    <CardTitle>Connection Pooling & Rate Limiting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      Advanced connection pooling manages database connections efficiently while preventing resource 
                      exhaustion. Rate limiting protects against brute force attacks and ensures fair resource 
                      allocation across all users.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                  <CardHeader>
                    <CardTitle>Regular Security Audits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      Our security policies and infrastructure undergo regular reviews and audits. We continuously 
                      monitor for vulnerabilities and apply security patches promptly. Our RLS policies are manually 
                      reviewed and tested to ensure they remain effective as the platform evolves.
                    </CardDescription>
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

