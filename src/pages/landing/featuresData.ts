import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CreditCard,
  DollarSign,
  FileCheck,
  FileStack,
  FileText,
  FolderKanban,
  Package,
  Paperclip,
  RefreshCw,
  Building2,
  ScrollText,
  Settings,
  Shield,
  Users,
  UsersRound,
} from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  details: string[];
}

/** Single source of truth for all product features (used by product page and by landing for first 6). */
export const allFeatures: Feature[] = [
  {
    icon: FileText,
    title: "Quote Builder",
    description: "From estimate to proposal in minutes",
    details: [
      "Build detailed quotes with line items, labor, and materials",
      "One-click contract generation from approved quotes",
      "Templates merge client info, totals, and payment schedules automatically",
      "Branded PDFs ready in seconds, not hours",
    ],
  },
  {
    icon: RefreshCw,
    title: "Change Orders",
    description: "Scope changes, handled cleanly",
    details: [
      "Create change orders that update contracts automatically",
      "Totals recalculate instantly — no manual math",
      "Clients approve directly in the portal",
      "Full history of what changed vs. original scope",
    ],
  },
  {
    icon: FileCheck,
    title: "Document Generation",
    description: "Contracts and proposals, automated",
    details: [
      "Generate contracts from templates with project data merged in",
      "No copy-paste errors — everything pulls from the source",
      "Customizable templates with your branding",
      "Export to PDF or Word",
    ],
  },
  {
    icon: Building2,
    title: "Lookbooks",
    description: "Present selections professionally",
    details: [
      "Curate product selections and materials visually",
      "Clients browse, comment, and approve in one place",
      "Organize by room, category, or project phase",
      "Link directly to vendor specifications",
    ],
  },
  {
    icon: DollarSign,
    title: "Payment Tracking",
    description: "Know where you stand, always",
    details: [
      "Define payment schedules tied to milestones",
      "See what's been paid vs. what's outstanding",
      "Track installments across all your projects",
      "Real-time financial visibility",
    ],
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Simple, not simplistic",
    details: [
      "Team members, PMs, finance, clients — each see what they need",
      "Set up roles that match how your team actually works",
      "Workspace-level permissions with granular control",
      "Full audit logging of who did what",
    ],
  },
  {
    icon: FolderKanban,
    title: "Projects & Pipeline",
    description: "Pipeline from lead to completed",
    details: [
      "Kanban-style pipeline for active projects",
      "Completed and Lost boards to close the loop",
      "Statuses and stages that fit your process",
      "Quick access to each project's full profile",
    ],
  },
  {
    icon: Users,
    title: "Clients",
    description: "Client management and history",
    details: [
      "Central client list with contact and project history",
      "Multiple projects per client when needed",
      "Client profile with all contracts and activity",
      "Search and filter to find anyone fast",
    ],
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    description: "Scheduling and appointments",
    details: [
      "Calendar view for events and appointments",
      "Link events to clients and projects",
      "Appointment types and recurring events",
      "Keep team and clients aligned on timing",
    ],
  },
  {
    icon: Package,
    title: "Materials",
    description: "Materials and pricing per project",
    details: [
      "Contract and revised materials per project",
      "Link materials to line items and change orders",
      "Pricing and quantities in one place",
      "Sync revisions when scope changes",
    ],
  },
  {
    icon: FileStack,
    title: "Contract Drafts",
    description: "Versions and draft management",
    details: [
      "Save multiple draft versions of contracts",
      "Compare and restore previous versions",
      "Active draft drives totals and change orders",
      "Clean history of what was sent when",
    ],
  },
  {
    icon: Paperclip,
    title: "Attachments",
    description: "Files and folders per project",
    details: [
      "Upload and organize files by project",
      "Folder structure with permission control",
      "Keep specs, drawings, and docs in one place",
      "Audit trail for uploads and deletions",
    ],
  },
  {
    icon: UsersRound,
    title: "Activity & Crew",
    description: "Assignments and project team",
    details: [
      "Assign clients and crew to projects",
      "Client assignments and project crew sections",
      "Visibility into who's on what project",
      "Supports role-based access to activity",
    ],
  },
  {
    icon: Settings,
    title: "Staff & Workspace",
    description: "Team and workspace setup",
    details: [
      "Invite and manage staff in your workspace",
      "Workspace setup and branding",
      "Theme and progress bar configuration",
      "Package groups and document group setup",
    ],
  },
  {
    icon: ScrollText,
    title: "Audit Log",
    description: "Who did what, when",
    details: [
      "Workspace-wide audit log of key actions",
      "Filter by user, action, and resource",
      "Compliance and accountability built in",
      "Export and review history when needed",
    ],
  },
  {
    icon: CreditCard,
    title: "Subscriptions & Billing",
    description: "Plans and payments",
    details: [
      "Stripe-powered subscriptions and billing",
      "Choose plan and manage subscription in Admin",
      "Checkout success and cancel flows",
      "One price for the workspace, no per-seat surprises",
    ],
  },
];
