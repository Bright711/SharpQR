export type UserRole = 'student' | 'teacher' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  full_name: string;
  email: string;
  password?: string; // Stored safely for mock logins
  role: UserRole;
  school_id: string | null;
  status: UserStatus;
  created_at: string;
}

export interface School {
  id: string;
  school_name: string;
  location: string;
  created_at: string;
}

export interface Subject {
  id: string;
  subject_name: string;
  grade_level: string; // e.g., "Grade 8", "Primary 5"
}

export interface Textbook {
  id: string;
  title: string;
  author: string;
  description: string;
  subject_id: string;
  cover_image: string; // Base64 or placeholder canvas / image url
  uploaded_by: string; // Teacher or Admin User ID
  date_added: string;
  savesCount: number;
}

export interface Chapter {
  id: string;
  textbook_id: string;
  chapter_name: string;
  chapter_number: number;
  description?: string;
}

export interface LearningResource {
  id: string;
  chapter_id: string;
  title: string;
  file_url: string; // Simulated link
  resource_type: 'pdf' | 'image' | 'notes' | 'link';
  content_text?: string; // Simulated contents for viewing online
  is_downloadable: boolean;
  expires_at?: string; // Optional expiry time
}

export interface QRCode {
  id: string;
  target_type: 'book' | 'chapter' | 'resource';
  target_id: string; // textbook_id or chapter_id or resource_id
  qr_code_url?: string; // Base64 generated QR
  created_at: string;
  expires_at?: string; // QR expiration tracking
  scan_count: number;
}

export interface ScanLog {
  id: string;
  student_id: string | null; // Null if scanned anonymously (or redirected to login)
  target_type: 'book' | 'chapter' | 'resource';
  target_id: string;
  target_name: string; // Book, Chapter, or Resource Title
  timestamp: string;
  school_id: string | null;
}

export interface StudentProgress {
  id: string; // unique identifier
  student_id: string;
  target_type: 'chapter' | 'resource';
  target_id: string;
  completed: boolean;
  timestamp: string;
}

export interface OfflineSyncAction {
  id: string;
  action_type: 'scan' | 'progress' | 'favorite';
  payload: {
    target_type: 'book' | 'chapter' | 'resource';
    target_id: string;
    completed?: boolean;
    is_favorite?: boolean;
    timestamp: string;
  };
  timestamp: string;
}

