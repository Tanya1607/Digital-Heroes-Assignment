// Placeholder DB types. Will be regenerated after the schema migration
// with:  npx supabase gen types typescript --project-id <id> > src/types/database.ts
// For now we widen the shape so Supabase query builders accept any table.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AnyRow = Record<string, unknown>;

type TableShape = {
  Row: AnyRow;
  Insert: AnyRow;
  Update: AnyRow;
  Relationships: [];
};

type RpcShape = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableShape;
      subscriptions: TableShape;
      scores: TableShape;
      charities: TableShape;
      donations: TableShape;
      draws: TableShape;
      draw_entries: TableShape;
      winners: TableShape;
      platform_config: TableShape;
      audit_log: TableShape;
    };
    Views: Record<string, never>;
    Functions: {
      compute_monthly_pool: RpcShape;
      generate_random_numbers: RpcShape;
      generate_algorithmic_numbers: RpcShape;
      run_draw: RpcShape;
      publish_draw: RpcShape;
      is_admin: RpcShape;
      has_active_subscription: RpcShape;
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
