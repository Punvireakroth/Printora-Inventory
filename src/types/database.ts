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
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          sort_order: number;
          status: "ACTIVE" | "INACTIVE";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          status?: "ACTIVE" | "INACTIVE";
        };
        Update: {
          name?: string;
          description?: string | null;
          sort_order?: number;
          status?: "ACTIVE" | "INACTIVE";
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          notes: string | null;
          status: "ACTIVE" | "INACTIVE";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          status?: "ACTIVE" | "INACTIVE";
        };
        Update: {
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          status?: "ACTIVE" | "INACTIVE";
        };
        Relationships: [];
      };
      system_settings: {
        Row: {
          id: number;
          default_locale: "en" | "km";
          next_receipt_seq: number;
          allow_cashier_discount: boolean;
          business_name: string | null;
          business_phone: string | null;
          global_low_stock: number;
          telegram_bot_token: string | null;
          telegram_chat_id: string | null;
          is_telegram_notify: boolean;
          cashier_allowed_modules: string[];
          updated_at: string;
        };
        Insert: {
          id?: number;
          default_locale?: "en" | "km";
          next_receipt_seq?: number;
          allow_cashier_discount?: boolean;
          business_name?: string | null;
          business_phone?: string | null;
          global_low_stock?: number;
          telegram_bot_token?: string | null;
          telegram_chat_id?: string | null;
          is_telegram_notify?: boolean;
          cashier_allowed_modules?: string[];
        };
        Update: {
          default_locale?: "en" | "km";
          next_receipt_seq?: number;
          allow_cashier_discount?: boolean;
          business_name?: string | null;
          business_phone?: string | null;
          global_low_stock?: number;
          telegram_bot_token?: string | null;
          telegram_chat_id?: string | null;
          is_telegram_notify?: boolean;
          cashier_allowed_modules?: string[];
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          supplier_id: string | null;
          name: string;
          sku: string;
          description: string | null;
          size: string | null;
          color: string | null;
          cost_price: number;
          selling_price: number;
          current_stock: number;
          minimum_stock: number;
          image_path: string | null;
          status: "ACTIVE" | "INACTIVE";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          supplier_id?: string | null;
          name: string;
          sku: string;
          description?: string | null;
          size?: string | null;
          color?: string | null;
          cost_price?: number;
          selling_price?: number;
          current_stock?: number;
          minimum_stock?: number;
          image_path?: string | null;
          status?: "ACTIVE" | "INACTIVE";
        };
        Update: {
          category_id?: string;
          supplier_id?: string | null;
          name?: string;
          sku?: string;
          description?: string | null;
          size?: string | null;
          color?: string | null;
          cost_price?: number;
          selling_price?: number;
          current_stock?: number;
          minimum_stock?: number;
          image_path?: string | null;
          status?: "ACTIVE" | "INACTIVE";
        };
        Relationships: [];
      };
      sales: {
        Row: {
          id: string;
          receipt_number: string;
          cashier_id: string;
          status: "COMPLETED" | "CANCELLED" | "REFUNDED";
          subtotal: number;
          discount_amount: number;
          total: number;
          payment_method: "CASH" | "BANK_TRANSFER" | "ABA" | "OTHER";
          locale_at_sale: "en" | "km";
          telegram_sent: boolean;
          completed_at: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          receipt_number: string;
          cashier_id: string;
          status?: "COMPLETED" | "CANCELLED" | "REFUNDED";
          subtotal?: number;
          discount_amount?: number;
          total?: number;
          payment_method?: "CASH" | "BANK_TRANSFER" | "ABA" | "OTHER";
          locale_at_sale?: "en" | "km";
          telegram_sent?: boolean;
          completed_at?: string;
          notes?: string | null;
        };
        Update: {
          receipt_number?: string;
          cashier_id?: string;
          status?: "COMPLETED" | "CANCELLED" | "REFUNDED";
          subtotal?: number;
          discount_amount?: number;
          total?: number;
          payment_method?: "CASH" | "BANK_TRANSFER" | "ABA" | "OTHER";
          locale_at_sale?: "en" | "km";
          telegram_sent?: boolean;
          completed_at?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          cost_price: number;
          product_name_snapshot: string;
          sku_snapshot: string;
          line_discount: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          cost_price: number;
          product_name_snapshot: string;
          sku_snapshot: string;
          line_discount?: number;
          line_total: number;
        };
        Update: {
          sale_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          cost_price?: number;
          product_name_snapshot?: string;
          sku_snapshot?: string;
          line_discount?: number;
          line_total?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      next_stock_receive_reference: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_stock_receive: {
        Args: {
          p_supplier_id: string | null;
          p_received_at: string;
          p_notes: string;
          p_items: { product_id: string; quantity: number; unit_cost: number }[];
        };
        Returns: string;
      };
      create_stock_adjustment: {
        Args: {
          p_product_id: string;
          p_new_quantity: number;
          p_reason: string;
        };
        Returns: string;
      };
      next_receipt_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      complete_sale: {
        Args: {
          p_payment_method: "CASH" | "BANK_TRANSFER" | "ABA" | "OTHER";
          p_locale_at_sale: string;
          p_items: {
            product_id: string;
            quantity: number;
            line_discount: number;
          }[];
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: "OWNER" | "CASHIER";
      active_status: "ACTIVE" | "INACTIVE";
    };
    CompositeTypes: Record<string, never>;
  };
};
