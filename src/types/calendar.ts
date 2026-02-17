import { EventItem } from './index';

// Attendee type with name and role
export interface EventAttendee {
  name: string;
  role: string | null;
  user_id: string;
}

// Extend EventItem with accountability fields and attendees
export interface EventItemWithAccountability extends EventItem {
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  attendees?: EventAttendee[];
}

// Database client type
export interface DatabaseClient {
  client_id: string;
  name: string;
  email?: string;
  phone?: string;
}

// Database project type
export interface ClientProject {
  project_id: string;
  name: string;
  address?: string;
  project_type?: string;
}

// Calendar appointment type (workspace-specific)
export interface CalendarAppointmentType {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  is_default: boolean;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

// Event form type (used for add/edit)
export interface EventFormData {
  // Required fields
  title?: string;
  date?: string;
  time?: string;
  
  // Optional fields
  clientId?: string;
  clientName?: string;
  appointmentTypeId?: string;
  projectId?: string; // NEW: Selected project ID
  projectType?: string;
  address?: string;
  
  // New project fields (when creating project from event)
  projectName?: string;
  
  // REMOVED: notes, assignedToUserId
}

// Loading states for event operations
export interface EventLoadingStates {
  isCreatingEvent: boolean;
  isUpdatingEvent: boolean;
  isDeletingEvent: boolean;
  isCreatingProject: boolean;
}

