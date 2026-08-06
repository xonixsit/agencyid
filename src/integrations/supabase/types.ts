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
          parent_id: string | null
          review_notes: string | null
          review_status: string
          status: Database["public"]["Enums"]["output_status"]
          strategy_id: string | null
          title: string
          trigger_event: string | null
          updated_at: string
          version: number
          workflow_steps: Json | null
        }
        Insert: {
          automation_type?: string
          client_id: string
          content: string
          created_at?: string
          ghl_template?: Json | null
          id?: string
          parent_id?: string | null
          review_notes?: string | null
          review_status?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title: string
          trigger_event?: string | null
          updated_at?: string
          version?: number
          workflow_steps?: Json | null
        }
        Update: {
          automation_type?: string
          client_id?: string
          content?: string
          created_at?: string
          ghl_template?: Json | null
          id?: string
          parent_id?: string | null
          review_notes?: string | null
          review_status?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title?: string
          trigger_event?: string | null
          updated_at?: string
          version?: number
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
            foreignKeyName: "automations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "automations"
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
      brand_assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["brand_asset_type"]
          client_id: string
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          meta: Json | null
          storage_path: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          value: string | null
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["brand_asset_type"]
          client_id: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          meta?: Json | null
          storage_path?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          value?: string | null
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["brand_asset_type"]
          client_id?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          meta?: Json | null
          storage_path?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          auto_chain: boolean
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
          auto_chain?: boolean
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
          auto_chain?: boolean
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
          parent_id: string | null
          platform: string | null
          review_notes: string | null
          review_status: string
          status: Database["public"]["Enums"]["output_status"]
          strategy_id: string | null
          target_audience: string | null
          title: string
          tone: string | null
          updated_at: string
          version: number
        }
        Insert: {
          call_to_action?: string | null
          client_id: string
          content: string
          copy_type: Database["public"]["Enums"]["copy_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          platform?: string | null
          review_notes?: string | null
          review_status?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          target_audience?: string | null
          title: string
          tone?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          call_to_action?: string | null
          client_id?: string
          content?: string
          copy_type?: Database["public"]["Enums"]["copy_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          platform?: string | null
          review_notes?: string | null
          review_status?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          target_audience?: string | null
          title?: string
          tone?: string | null
          updated_at?: string
          version?: number
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
            foreignKeyName: "copy_outputs_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "copy_outputs"
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
      creative_briefs: {
        Row: {
          brief_type: string
          client_id: string
          color_palette: Json | null
          content: string
          created_at: string
          dimensions: Json | null
          id: string
          parent_id: string | null
          platform: string | null
          review_notes: string | null
          review_status: string
          status: Database["public"]["Enums"]["output_status"]
          strategy_id: string | null
          title: string
          updated_at: string
          version: number
          visual_direction: string | null
        }
        Insert: {
          brief_type?: string
          client_id: string
          color_palette?: Json | null
          content: string
          created_at?: string
          dimensions?: Json | null
          id?: string
          parent_id?: string | null
          platform?: string | null
          review_notes?: string | null
          review_status?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title: string
          updated_at?: string
          version?: number
          visual_direction?: string | null
        }
        Update: {
          brief_type?: string
          client_id?: string
          color_palette?: Json | null
          content?: string
          created_at?: string
          dimensions?: Json | null
          id?: string
          parent_id?: string | null
          platform?: string | null
          review_notes?: string | null
          review_status?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title?: string
          updated_at?: string
          version?: number
          visual_direction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_briefs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_briefs_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "creative_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_briefs_strategy_id_fkey"
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
          parent_id: string | null
          review_notes: string | null
          review_status: string
          sections: Json | null
          status: Database["public"]["Enums"]["output_status"]
          strategy_id: string | null
          title: string
          updated_at: string
          version: number
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
          parent_id?: string | null
          review_notes?: string | null
          review_status?: string
          sections?: Json | null
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title: string
          updated_at?: string
          version?: number
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
          parent_id?: string | null
          review_notes?: string | null
          review_status?: string
          sections?: Json | null
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title?: string
          updated_at?: string
          version?: number
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
            foreignKeyName: "funnel_designs_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "funnel_designs"
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
      generated_visuals: {
        Row: {
          aspect_ratio: string | null
          brief_id: string | null
          client_id: string
          created_at: string
          id: string
          image_url: string
          parent_id: string | null
          platform: string | null
          prompt: string
          review_notes: string | null
          review_status: string
          title: string
          updated_at: string
          variation_label: string | null
          version: number
        }
        Insert: {
          aspect_ratio?: string | null
          brief_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          image_url: string
          parent_id?: string | null
          platform?: string | null
          prompt: string
          review_notes?: string | null
          review_status?: string
          title: string
          updated_at?: string
          variation_label?: string | null
          version?: number
        }
        Update: {
          aspect_ratio?: string | null
          brief_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          image_url?: string
          parent_id?: string | null
          platform?: string | null
          prompt?: string
          review_notes?: string | null
          review_status?: string
          title?: string
          updated_at?: string
          variation_label?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_visuals_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "creative_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_visuals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_visuals_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "generated_visuals"
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
          parent_id: string | null
          platform: string
          review_notes: string | null
          review_status: string
          status: Database["public"]["Enums"]["output_status"]
          strategy_id: string | null
          title: string
          total_budget: string | null
          updated_at: string
          version: number
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
          parent_id?: string | null
          platform?: string
          review_notes?: string | null
          review_status?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title: string
          total_budget?: string | null
          updated_at?: string
          version?: number
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
          parent_id?: string | null
          platform?: string
          review_notes?: string | null
          review_status?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_id?: string | null
          title?: string
          total_budget?: string | null
          updated_at?: string
          version?: number
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
            foreignKeyName: "media_plans_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "media_plans"
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          notify_review_ready: boolean
          notify_weekly_digest: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          notify_review_ready?: boolean
          notify_weekly_digest?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          notify_review_ready?: boolean
          notify_weekly_digest?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      project_tasks: {
        Row: {
          agent_type: string
          assigned_to: string | null
          client_id: string
          created_at: string
          deliverable_url: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          parent_id: string | null
          priority: string
          review_notes: string | null
          review_status: string
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          agent_type?: string
          assigned_to?: string | null
          client_id: string
          created_at?: string
          deliverable_url?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          parent_id?: string | null
          priority?: string
          review_notes?: string | null
          review_status?: string
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          agent_type?: string
          assigned_to?: string | null
          client_id?: string
          created_at?: string
          deliverable_url?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          parent_id?: string | null
          priority?: string
          review_notes?: string | null
          review_status?: string
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
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
          parent_id: string | null
          review_notes: string | null
          review_status: string
          status: Database["public"]["Enums"]["output_status"]
          strategy_type: Database["public"]["Enums"]["strategy_type"]
          target_segments: Json | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          campaign_channels?: string[] | null
          client_id: string
          content: string
          created_at?: string
          funnel_structure?: Json | null
          id?: string
          key_messages?: string[] | null
          parent_id?: string | null
          review_notes?: string | null
          review_status?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_type?: Database["public"]["Enums"]["strategy_type"]
          target_segments?: Json | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          campaign_channels?: string[] | null
          client_id?: string
          content?: string
          created_at?: string
          funnel_structure?: Json | null
          id?: string
          key_messages?: string[] | null
          parent_id?: string | null
          review_notes?: string | null
          review_status?: string
          status?: Database["public"]["Enums"]["output_status"]
          strategy_type?: Database["public"]["Enums"]["strategy_type"]
          target_segments?: Json | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
      brand_asset_type:
        | "logo"
        | "image"
        | "color"
        | "font"
        | "document"
        | "link"
        | "guideline"
        | "caption"
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
      app_role: ["admin", "member"],
      brand_asset_type: [
        "logo",
        "image",
        "color",
        "font",
        "document",
        "link",
        "guideline",
        "caption",
      ],
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
