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
      ai_generated_apps: {
        Row: {
          app_type: string
          build_logs: string | null
          created_at: string
          description: string | null
          id: string
          model_used: string | null
          preview_url: string | null
          prompt: string | null
          safety_flags: Json | null
          source_code: Json
          status: Database["public"]["Enums"]["mini_app_status"]
          title: string
          tokens_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_type?: string
          build_logs?: string | null
          created_at?: string
          description?: string | null
          id?: string
          model_used?: string | null
          preview_url?: string | null
          prompt?: string | null
          safety_flags?: Json | null
          source_code?: Json
          status?: Database["public"]["Enums"]["mini_app_status"]
          title: string
          tokens_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_type?: string
          build_logs?: string | null
          created_at?: string
          description?: string | null
          id?: string
          model_used?: string | null
          preview_url?: string | null
          prompt?: string | null
          safety_flags?: Json | null
          source_code?: Json
          status?: Database["public"]["Enums"]["mini_app_status"]
          title?: string
          tokens_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          daily_limit: number | null
          description: string | null
          email: string
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          daily_limit?: number | null
          description?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          daily_limit?: number | null
          description?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          ip_address: string | null
          message_count: number | null
          model_used: string | null
          origin: string | null
          pronoun_style: string | null
          request_id: string | null
          response_time_ms: number | null
          status_code: number | null
          stream_mode: boolean | null
          tokens_used: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          message_count?: number | null
          model_used?: string | null
          origin?: string | null
          pronoun_style?: string | null
          request_id?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          stream_mode?: boolean | null
          tokens_used?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          message_count?: number | null
          model_used?: string | null
          origin?: string | null
          pronoun_style?: string | null
          request_id?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          stream_mode?: boolean | null
          tokens_used?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      app_key_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          key_fingerprint: string
          masked_key: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          key_fingerprint: string
          masked_key: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          key_fingerprint?: string
          masked_key?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          created_at: string | null
          id: string
          message: string
          role: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          role: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          role?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fun_api_sync_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fun_api_sync_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          prompt: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          prompt: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          prompt?: string
          user_id?: string | null
        }
        Relationships: []
      }
      knowledge_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          message: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          topic_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          message?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          topic_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          message?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          topic_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_feedback_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "knowledge_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_topics: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          audio_url: string | null
          canonical_key: string | null
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          deprecated_at: string | null
          description: string | null
          effective_from: string | null
          effective_until: string | null
          icon: string | null
          id: string
          provided_by: string | null
          replaced_by: string | null
          reviewed_by: string | null
          source_title: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["knowledge_topic_status"]
          title: string
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          audio_url?: string | null
          canonical_key?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          deprecated_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          icon?: string | null
          id?: string
          provided_by?: string | null
          replaced_by?: string | null
          reviewed_by?: string | null
          source_title?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["knowledge_topic_status"]
          title: string
          version?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          audio_url?: string | null
          canonical_key?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          deprecated_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          icon?: string | null
          id?: string
          provided_by?: string | null
          replaced_by?: string | null
          reviewed_by?: string | null
          source_title?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["knowledge_topic_status"]
          title?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_topics_replaced_by_fkey"
            columns: ["replaced_by"]
            isOneToOne: false
            referencedRelation: "knowledge_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_app_generation_log: {
        Row: {
          action: string
          app_id: string | null
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          model: string | null
          safety_flags: Json | null
          tokens: number | null
          user_id: string | null
        }
        Insert: {
          action: string
          app_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          model?: string | null
          safety_flags?: Json | null
          tokens?: number | null
          user_id?: string | null
        }
        Update: {
          action?: string
          app_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          model?: string | null
          safety_flags?: Json | null
          tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mini_app_generation_log_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_app_quota_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          extra_daily: number | null
          extra_monthly: number | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          extra_daily?: number | null
          extra_monthly?: number | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          extra_daily?: number | null
          extra_monthly?: number | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mini_app_quotas: {
        Row: {
          bonus_quota: number | null
          burst_per_hour: number | null
          daily_limit: number | null
          id: string
          monthly_limit: number | null
          notes: string | null
          role: string
          token_budget: number | null
          updated_at: string
        }
        Insert: {
          bonus_quota?: number | null
          burst_per_hour?: number | null
          daily_limit?: number | null
          id?: string
          monthly_limit?: number | null
          notes?: string | null
          role: string
          token_budget?: number | null
          updated_at?: string
        }
        Update: {
          bonus_quota?: number | null
          burst_per_hour?: number | null
          daily_limit?: number | null
          id?: string
          monthly_limit?: number | null
          notes?: string | null
          role?: string
          token_budget?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      post_media: {
        Row: {
          created_at: string | null
          id: string
          media_id: string
          order_index: number | null
          post_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_id: string
          order_index?: number | null
          post_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          media_id?: string
          order_index?: number | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "video_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          mood: string | null
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          mood?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          mood?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          fun_id: string | null
          id: string
          language: string | null
          light_points: number | null
          onboarding_completed: boolean | null
          synced_with_fun_api_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          fun_id?: string | null
          id: string
          language?: string | null
          light_points?: number | null
          onboarding_completed?: boolean | null
          synced_with_fun_api_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          fun_id?: string | null
          id?: string
          language?: string | null
          light_points?: number | null
          onboarding_completed?: boolean | null
          synced_with_fun_api_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      system_prompts: {
        Row: {
          category: string
          content: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      system_prompts_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          content: string
          id: string
          prompt_id: string
          slug: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          content: string
          id?: string
          prompt_id: string
          slug: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          content?: string
          id?: string
          prompt_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_prompts_history_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "system_prompts"
            referencedColumns: ["id"]
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_metadata: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          file_type: string
          height: number | null
          id: string
          mime_type: string | null
          preview_gif_url: string | null
          r2_key: string | null
          r2_url: string | null
          resized_urls: Json | null
          status: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_type?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          preview_gif_url?: string | null
          r2_key?: string | null
          r2_url?: string | null
          resized_urls?: Json | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_type?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          preview_gif_url?: string | null
          r2_key?: string | null
          r2_url?: string | null
          resized_urls?: Json | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_credit_usage_summary: { Args: { p_days?: number }; Returns: Json }
      get_daily_usage_count: { Args: { p_api_key_id: string }; Returns: number }
      get_mini_app_quota_status: { Args: { p_user_id?: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_light_points: {
        Args: { _amount?: number; _user_id: string }
        Returns: number
      }
      update_system_prompt: {
        Args: { _content: string; _slug: string }
        Returns: {
          category: string
          content: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "system_prompts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      knowledge_topic_status:
        | "draft"
        | "review"
        | "approved"
        | "active"
        | "deprecated"
        | "archived"
      mini_app_status: "draft" | "preview" | "approved" | "deployed" | "failed"
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
      app_role: ["admin", "moderator", "user"],
      knowledge_topic_status: [
        "draft",
        "review",
        "approved",
        "active",
        "deprecated",
        "archived",
      ],
      mini_app_status: ["draft", "preview", "approved", "deployed", "failed"],
    },
  },
} as const
