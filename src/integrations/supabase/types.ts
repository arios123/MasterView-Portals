export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      calendar_events: {
        Row: {
          address: string | null
          appointment_type_id: string
          assigned_to: string[]
          client_id: string
          client_name: string | null
          created_at: string
          created_by: string
          email: string | null
          event_date: string
          event_time: string
          id: string
          notes: string | null
          phone: string | null
          project_type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          appointment_type_id: string
          assigned_to?: string[]
          client_id: string
          client_name?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          event_date: string
          event_time: string
          id?: string
          notes?: string | null
          phone?: string | null
          project_type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          appointment_type_id?: string
          assigned_to?: string[]
          client_id?: string
          client_name?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          event_date?: string
          event_time?: string
          id?: string
          notes?: string | null
          phone?: string | null
          project_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_calendar_events_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      clients: {
        Row: {
          active_project: string | null
          assigned_employee: string | null
          client_id: string
          created_at: string
          email: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active_project?: string | null
          assigned_employee?: string | null
          client_id?: string
          created_at?: string
          email?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active_project?: string | null
          assigned_employee?: string | null
          client_id?: string
          created_at?: string
          email?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      labor_options: {
        Row: {
          created_at: string
          id: string
          name: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      lookbook_options: {
        Row: {
          brand: string
          category: string
          created_at: string
          finish: string
          id: string
          image: string
          link: string | null
          price: number | null
          style: string
          updated_at: string
        }
        Insert: {
          brand: string
          category: string
          created_at?: string
          finish: string
          id?: string
          image: string
          link?: string | null
          price?: number | null
          style: string
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          finish?: string
          id?: string
          image?: string
          link?: string | null
          price?: number | null
          style?: string
          updated_at?: string
        }
        Relationships: []
      }
      lookbooks: {
        Row: {
          budget: string | null
          changes_wanted: string | null
          electrical_updates: string | null
          finishes_and_colors: string | null
          foundation: string | null
          gas_type: string | null
          hoa_rules: string | null
          house_types_and_age: string | null
          hvac_issues: string | null
          inspiration_links: string | null
          kids_pets_access: string | null
          length_of_stay: string | null
          live_in_home_during_project: string | null
          lookbook_id: string
          main_goal: string | null
          past_renos_issues: string | null
          permits: string | null
          project_floor: string | null
          project_id: string | null
          storage_needs: string | null
          style: string | null
          timeline: string | null
          use_of_space: string | null
          water_source: string | null
          work_restirctions: string | null
        }
        Insert: {
          budget?: string | null
          changes_wanted?: string | null
          electrical_updates?: string | null
          finishes_and_colors?: string | null
          foundation?: string | null
          gas_type?: string | null
          hoa_rules?: string | null
          house_types_and_age?: string | null
          hvac_issues?: string | null
          inspiration_links?: string | null
          kids_pets_access?: string | null
          length_of_stay?: string | null
          live_in_home_during_project?: string | null
          lookbook_id?: string
          main_goal?: string | null
          past_renos_issues?: string | null
          permits?: string | null
          project_floor?: string | null
          project_id?: string | null
          storage_needs?: string | null
          style?: string | null
          timeline?: string | null
          use_of_space?: string | null
          water_source?: string | null
          work_restirctions?: string | null
        }
        Update: {
          budget?: string | null
          changes_wanted?: string | null
          electrical_updates?: string | null
          finishes_and_colors?: string | null
          foundation?: string | null
          gas_type?: string | null
          hoa_rules?: string | null
          house_types_and_age?: string | null
          hvac_issues?: string | null
          inspiration_links?: string | null
          kids_pets_access?: string | null
          length_of_stay?: string | null
          live_in_home_during_project?: string | null
          lookbook_id?: string
          main_goal?: string | null
          past_renos_issues?: string | null
          permits?: string | null
          project_floor?: string | null
          project_id?: string | null
          storage_needs?: string | null
          style?: string | null
          timeline?: string | null
          use_of_space?: string | null
          water_source?: string | null
          work_restirctions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lookbooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      material_options: {
        Row: {
          created_at: string
          id: string
          name: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      material_revisions: {
        Row: {
          created_at: string
          id: string
          is_unmodified: boolean
          link: string | null
          linked_to_id: string | null
          linked_to_name: string | null
          name: string
          notes: string | null
          original_material_id: string | null
          price: number
          quantity: number
          updated_at: string
          version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_unmodified?: boolean
          link?: string | null
          linked_to_id?: string | null
          linked_to_name?: string | null
          name: string
          notes?: string | null
          original_material_id?: string | null
          price: number
          quantity?: number
          updated_at?: string
          version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_unmodified?: boolean
          link?: string | null
          linked_to_id?: string | null
          linked_to_name?: string | null
          name?: string
          notes?: string | null
          original_material_id?: string | null
          price?: number
          quantity?: number
          updated_at?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_revisions_original_material_id_fkey"
            columns: ["original_material_id"]
            isOneToOne: false
            referencedRelation: "version_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_revisions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "project_versions"
            referencedColumns: ["version_id"]
          },
        ]
      }
      outgoing_payments: {
        Row: {
          actual_paid: number | null
          adjusted_price: number | null
          budget: number
          created_at: string
          date: string
          id: string
          link: string | null
          material_name: string
          project_id: string
          qty: number | null
          tracking: string | null
          updated_at: string
        }
        Insert: {
          actual_paid?: number | null
          adjusted_price?: number | null
          budget?: number
          created_at?: string
          date: string
          id?: string
          link?: string | null
          material_name: string
          project_id: string
          qty?: number | null
          tracking?: string | null
          updated_at?: string
        }
        Update: {
          actual_paid?: number | null
          adjusted_price?: number | null
          budget?: number
          created_at?: string
          date?: string
          id?: string
          link?: string | null
          material_name?: string
          project_id?: string
          qty?: number | null
          tracking?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          id: string
          item_ids: string[]
          name: string
          preset_group: string
          updated_at: string
          zero_labor: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          item_ids?: string[]
          name: string
          preset_group: string
          updated_at?: string
          zero_labor?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          item_ids?: string[]
          name?: string
          preset_group?: string
          updated_at?: string
          zero_labor?: boolean
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          for_field: string | null
          note: string | null
          payment_id: string
          project_id: string
          received_by: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          for_field?: string | null
          note?: string | null
          payment_id?: string
          project_id: string
          received_by?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          for_field?: string | null
          note?: string | null
          payment_id?: string
          project_id?: string
          received_by?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_folders: {
        Row: {
          created_at: string | null
          created_by: string | null
          folder_name: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          folder_name: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          folder_name?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_lookbook_selections: {
        Row: {
          created_at: string
          id: string
          lookbook_option_id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lookbook_option_id: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lookbook_option_id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_lookbook_selections_lookbook_option_id_fkey"
            columns: ["lookbook_option_id"]
            isOneToOne: false
            referencedRelation: "lookbook_options"
            referencedColumns: ["id"]
          },
        ]
      }
      project_versions: {
        Row: {
          created_at: string
          created_by: string
          estimated_construction_time: number | null
          estimated_start_date: string | null
          is_active: boolean | null
          multiplier: number | null
          name: string | null
          payment_1_percentage: number | null
          payment_2_percentage: number | null
          payment_3_percentage: number | null
          payment_4_percentage: number | null
          project_id: string
          status: string | null
          updated_at: string
          version_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          estimated_construction_time?: number | null
          estimated_start_date?: string | null
          is_active?: boolean | null
          multiplier?: number | null
          name?: string | null
          payment_1_percentage?: number | null
          payment_2_percentage?: number | null
          payment_3_percentage?: number | null
          payment_4_percentage?: number | null
          project_id: string
          status?: string | null
          updated_at?: string
          version_id?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          estimated_construction_time?: number | null
          estimated_start_date?: string | null
          is_active?: boolean | null
          multiplier?: number | null
          name?: string | null
          payment_1_percentage?: number | null
          payment_2_percentage?: number | null
          payment_3_percentage?: number | null
          payment_4_percentage?: number | null
          project_id?: string
          status?: string | null
          updated_at?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      projects: {
        Row: {
          active_version: string | null
          address: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          name: string | null
          notes: string | null
          project_id: string
          project_type: string | null
          status: string
        }
        Insert: {
          active_version?: string | null
          address?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          name?: string | null
          notes?: string | null
          project_id?: string
          project_type?: string | null
          status?: string
        }
        Update: {
          active_version?: string | null
          address?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          name?: string | null
          notes?: string | null
          project_id?: string
          project_type?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          role: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      version_labor: {
        Row: {
          created_at: string
          id: string
          labor_id: string
          price: number
          quantity: number
          updated_at: string
          version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          labor_id: string
          price: number
          quantity?: number
          updated_at?: string
          version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          labor_id?: string
          price?: number
          quantity?: number
          updated_at?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "version_labor_labor_id_fkey"
            columns: ["labor_id"]
            isOneToOne: false
            referencedRelation: "labor_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "version_labor_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "project_versions"
            referencedColumns: ["version_id"]
          },
        ]
      }
      version_materials: {
        Row: {
          created_at: string
          id: string
          material_id: string
          price: number
          quantity: number
          updated_at: string
          version_id: string
          waste_pct: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          price: number
          quantity?: number
          updated_at?: string
          version_id: string
          waste_pct?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          price?: number
          quantity?: number
          updated_at?: string
          version_id?: string
          waste_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "version_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "material_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "version_materials_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "project_versions"
            referencedColumns: ["version_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role:
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
    }
    Enums: {
      app_role: "admin" | "designer" | "accounting" | "pm" | "crew" | "driver"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "designer", "accounting", "pm", "crew", "driver"],
    },
  },
} as const
