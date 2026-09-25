export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent' | 'psychologist' | 'student';
  username?: string;
  password?: string;
  studentId?: number;
}

export interface Student {
  id: number;
  name: string;
  parent_id: number;
  teacher_id: number;
  parent_name?: string;
  teacher_name?: string;
  teacher_email?: string;
  username?: string;
  password?: string;
  user_id?: number;
}

export interface ExerciseQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Exercise {
  id: number;
  title: string;
  subject: string;
  description?: string;
  difficulty: 'Oson' | "O'rta" | 'Qiyin';
  points: number;
  questions: ExerciseQuestion[];
  created_by?: number;
  created_at?: string;
}

export interface ExerciseSubmission {
  id: number;
  student_id: number;
  exercise_id: number;
  score: number;
  total_questions: number;
  completed_at: string;
  student_name?: string;
  exercise_title?: string;
  subject?: string;
}

// 1. "Meros izidan" moduli turlari
export interface HeritageMaterial {
  id: number;
  title: string;
  type: string;
  content: string;
  connection?: string;
  values_direction?: string;
  questions: string[];
  author_or_source?: string;
  created_at?: string;
}

export interface HeritageSubmissionItem {
  questionNumber: number;
  question: string;
  answer: string;
}

export interface HeritageSubmission {
  id: number;
  student_id: number;
  material_id: number;
  answers: HeritageSubmissionItem[] | Record<string, string> | any;
  completed_at: string;
  student_name?: string;
  material_title?: string;
  material_type?: string;
  values_direction?: string;
  author_or_source?: string;
}

// 2. "Men qanday yo‘l tutaman?" moduli turlari
export interface MoralSituationOption {
  id: number;
  text: string;
}

export interface MoralSituation {
  id: number;
  title: string;
  category: string;
  situation_text: string;
  options: MoralSituationOption[];
  values_direction?: string;
  reason_prompt?: string;
  consequence_prompt?: string;
  created_at?: string;
}

export interface MoralChoiceSubmission {
  id: number;
  student_id: number;
  situation_id: number;
  selected_option_id: number;
  selected_option_text: string;
  reason: string;
  expected_consequence: string;
  created_at: string;
  student_name?: string;
  situation_title?: string;
  situation_text?: string;
  category?: string;
}

// 3. "Ezgu ishlarim" moduli turlari
export interface GoodDeedTask {
  id: number;
  title: string;
  value_name?: string;
  description: string;
  category: string;
  created_at?: string;
}

export interface GoodDeedRecord {
  id: number;
  student_id: number;
  task_id?: number | null;
  what_done: string;
  with_whom: string;
  result_impact: string;
  status?: 'in_progress' | 'submitted' | 'reviewed' | 'feedback_given';
  teacher_verified: number;
  teacher_feedback: string;
  teacher_name?: string;
  created_at: string;
  completed_at?: string;
  student_name?: string;
  task_title?: string;
  task_description?: string;
  value_name?: string;
}

export interface EQNote {
  id: number;
  student_id: number;
  teacher_id: number;
  note: string;
  mood: string;
  created_at: string;
  teacher_name?: string;
}

export interface PerformanceData {
  id: number;
  student_id: number;
  subject: string;
  score: number;
  attendance_rate: number;
  activity_level: number;
  month: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export interface CareerSuggestion {
  title: string;
  type: string;
  description: string;
}

export interface ScheduleItem {
  id: number;
  day: string;
  time: string;
  subject: string;
  teacher_id: number;
}
