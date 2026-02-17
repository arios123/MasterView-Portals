import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Calendar, 
  FileText, 
  DollarSign, 
  Users, 
  Package, 
  CheckSquare,
  Building2,
  BarChart3,
  Shield,
  FileCheck
} from "lucide-react";

export const features = [
  {
    icon: FileText,
    title: "Quote Builder",
    description: "Create detailed, professional quotes with customizable line items, labor costs, and material pricing. Save drafts and generate final quotes in minutes.",
  },
  {
    icon: Calendar,
    title: "Project Calendar",
    description: "Schedule appointments, track project timelines, and manage your team's availability all in one centralized calendar view.",
  },
  {
    icon: DollarSign,
    title: "Payment Tracking",
    description: "Track payments, manage payment splits, and monitor project finances with detailed payment schedules and history.",
  },
  {
    icon: Users,
    title: "Client Management",
    description: "Maintain comprehensive client profiles with contact information, project history, and communication logs in one place.",
  },
  {
    icon: Package,
    title: "Materials Management",
    description: "Track materials, manage inventory, and organize product selections with detailed specifications and pricing information.",
  },
  {
    icon: CheckSquare,
    title: "Change Orders",
    description: "Handle project changes efficiently with detailed change order tracking, version control, and approval workflows.",
  },
  {
    icon: Building2,
    title: "Lookbook",
    description: "Create and share visual lookbooks with clients. Organize product selections, materials, and design inspiration by category.",
  },
  {
    icon: BarChart3,
    title: "Project Analytics",
    description: "Gain insights into project performance, track progress, and monitor team productivity with detailed analytics and reporting.",
  },
  {
    icon: Shield,
    title: "Custom Roles & Permissions",
    description: "Create custom roles with granular permissions tailored to your team structure. Control access to features, tabs, and components with fine-grained RBAC controls.",
  },
  {
    icon: FileCheck,
    title: "Document Templates & Storage",
    description: "Create reusable document templates, store project files securely, and manage all your business documents in one centralized location with version control.",
  },
];

export function Features() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-2">
            Everything You Need to Run Your Design Business
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto px-4">
            Powerful features designed to help renovation and design professionals 
            manage projects from initial quote to final payment.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-3 mb-8 sm:mb-12 md:mb-14">
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50">
            <p className="text-sm font-semibold text-emerald-600 mb-2">Operational OS</p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Run the whole project in one place</h3>
            <p className="text-sm text-slate-600">
              Scheduling, statuses, change orders, documents, and payments stay linked to each project, so nothing slips through.
            </p>
          </div>
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50">
            <p className="text-sm font-semibold text-emerald-600 mb-2">Client Experience</p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Transparent, branded client portal</h3>
            <p className="text-sm text-slate-600">
              Share lookbooks, approvals, and timelines in a clean portal—clients always know what's next and what was decided.
            </p>
          </div>
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50">
            <p className="text-sm font-semibold text-emerald-600 mb-2">Control & Roles</p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Roles that match your team</h3>
            <p className="text-sm text-slate-600">
              Designers, PMs, finance, and vendors get only what they need. Fine-grained permissions keep sensitive data locked down.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.slice(0, 8).map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="border-slate-200 hover:border-slate-300 transition-all duration-200 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-slate-900" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Centered additional features */}
        {features.length > 8 && (
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 sm:mt-6">
            {features.slice(8).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index + 8}
                  className="border-slate-200 hover:border-slate-300 transition-all duration-200 hover:shadow-lg w-full sm:w-full md:w-[calc(50%-12px)] lg:w-[400px]"
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-slate-900" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

