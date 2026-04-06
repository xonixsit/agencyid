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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      automations: {
        Row: {
          automation_type: string
          client_id: string
          content: string
          created_at: string
          ghl_template: Json | null
          id: string
          status: Database["public"]["Enums"]["output_status"]
          strategy_id: string | null
          title: string
          trigger_event: string | null
          updated_at: string
          workflow_steps: Json | null
        }
        Insert: {
          automation_type?: string
          client_id: string
          content: string
          created_at?: string
          ghl_template?: Json | null
          id?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title: string
          trigger_event?: string | null
          updated_at?: string
          workflow_steps?: Json | null
        }
        Update: {
          automation_type?: string
          client_id?: string
          content?: string
          created_at?: string
          ghl_template?: Json | null
          id?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title?: string
          trigger_event?: string | null
          updated_at?: string
          workflow_steps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          brand_voice: string | null
          budget: string | null
          company_name: string
          competitors: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          goals: string | null
          id: string
          industry: string | null
          notes: string | null
          offer: string | null
          positioning: string | null
          status: Database["public"]["Enums"]["client_status"]
          target_audience: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          brand_voice?: string | null
          budget?: string | null
          company_name: string
          competitors?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          goals?: string | null
          id?: string
          industry?: string | null
          notes?: string | null
          offer?: string | null
          positioning?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          target_audience?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          brand_voice?: string | null
          budget?: string | null
          company_name?: string
          competitors?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          goals?: string | null
          id?: string
          industry?: string | null
          notes?: string | null
          offer?: string | null
          positioning?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          target_audience?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      copy_outputs: {
        Row: {
          call_to_action: string | null
          client_id: string
          content: string
          copy_type: Database["public"]["Enums"]["copy_type"]
          created_at: string
          id: string
          metadata: Json | null
          platform: string | null
          status: Database["public"]["Enums"]["output_status"]
          strategy_id: string | null
          target_audience: string | null
          title: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          call_to_action?: string | null
          client_id: string
          content: string
          copy_type: Database["public"]["Enums"]["copy_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          platform?: string | null
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          target_audience?: string | null
          title: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          call_to_action?: string | null
          client_id?: string
          content?: string
          copy_type?: Database["public"]["Enums"]["copy_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          platform?: string | null
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          target_audience?: string | null
          title?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_outputs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_outputs_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_designs: {
        Row: {
          client_id: string
          content: string
          created_at: string
          flow_structure: Json | null
          funnel_type: string
          ghl_template: Json | null
          id: string
          page_count: number | null
          sections: Json | null
          status: Database["public"]["Enums"]["output_status"]
          strategy_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          flow_structure?: Json | null
          funnel_type?: string
          ghl_template?: Json | null
          id?: string
          page_count?: number | null
          sections?: Json | null
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          flow_structure?: Json | null
          funnel_type?: string
          ghl_template?: Json | null
          id?: string
          page_count?: number | null
          sections?: Json | null
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_designs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_designs_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      media_plans: {
        Row: {
          ad_placements: Json | null
          audience_targeting: Json | null
          campaign_objective: string
          campaign_structure: Json | null
          client_id: string
          content: string
          created_at: string
          daily_budget: string | null
          id: string
          platform: string
          status: Database["public"]["Enums"]["output_status"]
          strategy_id: string | null
          title: string
          total_budget: string | null
          updated_at: string
        }
        Insert: {
          ad_placements?: Json | null
          audience_targeting?: Json | null
          campaign_objective?: string
          campaign_structure?: Json | null
          client_id: string
          content: string
          created_at?: string
          daily_budget?: string | null
          id?: string
          platform?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title: string
          total_budget?: string | null
          updated_at?: string
        }
        Update: {
          ad_placements?: Json | null
          audience_targeting?: Json | null
          campaign_objective?: string
          campaign_structure?: Json | null
          client_id?: string
          content?: string
          created_at?: string
          daily_budget?: string | null
          id?: string
          platform?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title?: string
          total_budget?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_plans_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          campaign_channels: string[] | null
          client_id: string
          content: string
          created_at: string
          funnel_structure: Json | null
          id: string
          key_messages: string[] | null
          status: Database["public"]["Enums"]["output_status"]
          strategy_type: Database["public"]["Enums"]["strategy_type"]
          target_segments: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          campaign_channels?: string[] | null
          client_id: string
          content: string
          created_at?: string
          funnel_structure?: Json | null
          id?: string
          key_messages?: string[] | null
          status?: Database["public"]["Enums"]["output_status"]
          strategy_type?: Database["public"]["Enums"]["strategy_type"]
          target_segments?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          campaign_channels?: string[] | null
          client_id?: string
          content?: string
          created_at?: string
          funnel_structure?: Json | null
          id?: string
          key_messages?: string[] | null
          status?: Database["public"]["Enums"]["output_status"]
          strategy_type?: Database["public"]["Enums"]["strategy_type"]
          target_segments?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      client_status: "onboarding" | "active" | "paused" | "completed"
      copy_type:
        | "ad_copy"
        | "email_sequence"
        | "landing_page"
        | "sales_page"
        | "social_post"
        | "sms"
        | "headline"
      output_status: "draft" | "review" | "approved" | "deployed"
      strategy_type:
        | "full_funnel"
        | "top_of_funnel"
        | "mid_funnel"
        | "bottom_funnel"
        | "retention"
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
      client_status: ["onboarding", "active", "paused", "completed"],
      copy_type: [
        "ad_copy",
        "email_sequence",
        "landing_page",
        "sales_page",
        "social_post",
        "sms",
        "headline",
      ],
      output_status: ["draft", "review", "approved", "deployed"],
      strategy_type: [
        "full_funnel",
        "top_of_funnel",
        "mid_funnel",
        "bottom_funnel",
        "retention",
      ],
    },
  },
} as const
