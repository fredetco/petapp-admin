export type AdminRole = 'super_admin' | 'content_admin' | 'viewer';

export interface AdminUser {
  id: string;
  user_id: string;
  role: AdminRole;
  name: string;
  email: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}
