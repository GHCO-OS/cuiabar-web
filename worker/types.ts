export type RoleName = 'gerente' | 'operador_marketing';

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  AI?: Ai;
  WHATSAPP_KV: KVNamespace;
  APP_NAME: string;
  APP_BASE_URL: string;
  SESSION_COOKIE_NAME: string;
  CSRF_COOKIE_NAME: string;
  DEFAULT_FROM_EMAIL: string;
  DEFAULT_FROM_NAME: string;
  DEFAULT_REPLY_TO: string;
  IFOOD_STORE_URL?: string;
  FOOD99_STORE_URL?: string;
  AUTH_MODE?: string;
  GOOGLE_AUTH_CLIENT_ID?: string;
  GOOGLE_ALLOWED_EMAILS?: string;
  GOOGLE_MANAGER_EMAILS?: string;
  ENABLE_OPEN_TRACKING?: string;
  SEND_BATCH_SIZE?: string;
  SEND_RATE_PER_MINUTE?: string;
  SEND_PAUSE_MS?: string;
  CAMPAIGN_MAX_RECIPIENTS?: string;
  DOUBLE_OPT_IN_ENABLED?: string;
  SETUP_ADMIN_TOKEN?: string;
  CRM_INTEGRATION_MODE?: string;
  CRM_BASE_URL?: string;
  CRM_INTERNAL_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_AI_API_TOKEN?: string;
  WHATSAPP_AI_MODEL?: string;
  WHATSAPP_AI_MODE?: string;
  WHATSAPP_MENU_URL?: string;
  WHATSAPP_BURGER_URL?: string;
  WHATSAPP_DELIVERY_URL?: string;
  WHATSAPP_EXPRESSO_URL?: string;
  WHATSAPP_CHANNEL_URL?: string;
  WHATSAPP_ADDRESS?: string;
  WHATSAPP_HOURS_SUMMARY?: string;
  WHATSAPP_PHONE_DISPLAY?: string;
  WHATSAPP_RESERVATION_BEST_EFFORT_ENABLED?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
  GOOGLE_CALENDAR_ID?: string;
  GMAIL_SENDER_EMAIL?: string;
  GMAIL_SENDER_NAME?: string;
  RESERVATION_NOTIFICATION_EMAIL?: string;
  RESERVATION_APP_BASE_URL?: string;
  GOOGLE_ADS_API_VERSION?: string;
  GOOGLE_ADS_CUSTOMER_ID?: string;
  GOOGLE_ADS_LOGIN_CUSTOMER_ID?: string;
  GOOGLE_ADS_DEVELOPER_TOKEN?: string;
  GOOGLE_ADS_CLIENT_ID?: string;
  GOOGLE_ADS_CLIENT_SECRET?: string;
  GOOGLE_ADS_REFRESH_TOKEN?: string;
  META_GRAPH_API_VERSION?: string;
  META_PIXEL_ID?: string;
  META_ACCESS_TOKEN?: string;
  META_CAPI_TOKEN?: string;
  ZOHO_ACCOUNTS_DOMAIN?: string;
  ZOHO_API_DOMAIN?: string;
  ZOHO_CLIENT_ID?: string;
  ZOHO_CLIENT_SECRET?: string;
  ZOHO_REFRESH_TOKEN?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: RoleName[];
}

export interface SessionRecord {
  id: string;
  userId: string;
  csrfToken: string;
  expiresAt: string;
}

export interface AppVariables {
  user: AuthUser | null;
  session: SessionRecord | null;
}

export interface ContactRecord {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  source: string | null;
  tags_json: string;
  status: string;
  opt_in_status: string;
  unsubscribed_at: string | null;
  last_sent_at: string | null;
  last_clicked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateRecord {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  html_content: string;
  text_content: string;
  variables_json: string;
}

export interface CampaignRecord {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  template_id: string;
  segment_id: string | null;
  list_id: string | null;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  total_recipients: number;
  total_sent: number;
  total_failed: number;
  total_clicked: number;
  total_unsubscribed: number;
  total_click_events: number;
  total_unique_clicks: number;
  delivery_observed_rate: number;
  send_batch_size: number;
  send_rate_per_minute: number;
  send_pause_ms: number;
  max_recipients: number;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}
