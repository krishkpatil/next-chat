export interface User {
  id: string;
  created_at: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  last_seen?: string;
}

export interface Chat {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  is_group: boolean;
  last_message?: string;
  last_message_at?: string;
  participants?: User[];
  participant_count?: number;
  tags?: Tag[];
  unread_count?: number;
}

export interface ChatParticipant {
  id: string;
  created_at: string;
  chat_id: string;
  user_id: string;
  is_admin: boolean;
  user?: User;
}

export interface Message {
  id: string;
  created_at: string;
  chat_id: string;
  user_id: string;
  content: string;
  is_system_message: boolean;
  metadata?: {
    status?: "sent" | "delivered" | "read";
    read_by?: string[];
  };
  reply_to_id?: string;
  deleted_at?: string;
  user?: User;
}

export interface MessageStatus {
  id: string;
  created_at: string;
  updated_at: string;
  message_id: string;
  user_id: string;
  status: "delivered" | "read";
}

export interface Tag {
  id: string;
  created_at: string;
  name: string;
}

export interface ChatTag {
  id: string;
  created_at: string;
  chat_id: string;
  tag_id: string;
  tag?: Tag;
}
