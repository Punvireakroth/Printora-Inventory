/** Minimal Supabase schema typing until `supabase gen types typescript` is adopted. */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "OWNER" | "CASHIER";
          account_status: "ACTIVE" | "INACTIVE";
          preferred_locale: "en" | "km";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string;
          full_name?: string | null;
          role?: "OWNER" | "CASHIER";
          account_status?: "ACTIVE" | "INACTIVE";
          preferred_locale?: "en" | "km";
        };
        Update: {
          email?: string;
          full_name?: string | null;
          role?: "OWNER" | "CASHIER";
          account_status?: "ACTIVE" | "INACTIVE";
          preferred_locale?: "en" | "km";
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "OWNER" | "CASHIER";
      active_status: "ACTIVE" | "INACTIVE";
    };
    CompositeTypes: Record<string, never>;
  };
};
