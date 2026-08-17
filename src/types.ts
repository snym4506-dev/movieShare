export interface Room {
  id: string;
  code: string;
  host_name: string;
  active: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  author_name: string;
  content: string;
  created_at: string;
}
