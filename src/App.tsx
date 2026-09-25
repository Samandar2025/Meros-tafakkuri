import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  GraduationCap, 
  BrainCircuit, 
  UserCircle, 
  TrendingDown, 
  TrendingUp,
  Send,
  PlusCircle,
  Smile,
  Frown,
  Meh,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  BookOpen,
  Trophy,
  Trash2,
  X,
  Calendar,
  Clock,
  ShieldCheck,
  Key,
  Edit3,
  LogOut,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Menu,
  ScrollText,
  Compass,
  HeartHandshake,
  Eye,
  CheckCircle2,
  Award,
  Users,
  Check
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  User,
  Student, 
  PerformanceData, 
  EQNote, 
  Message, 
  CareerSuggestion,
  ScheduleItem,
  Exercise,
  ExerciseSubmission
} from './types';
import { 
  analyzePerformance, 
  analyzeEQ, 
  mediateChat, 
  suggestCareerPath 
} from './services/geminiService';
import { ExercisesView } from './components/ExercisesView';
import { StudentCredentialsModal } from './components/StudentCredentialsModal';
import { downloadScheduleAsImage, downloadScheduleAsPDF } from './utils/scheduleExport';

const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
  PSYCHOLOGIST: 'psychologist',
  STUDENT: 'student'
};

const NAV_CONFIG = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', shortLabel: 'Asosiy' },
  { id: 'exercises', icon: BookOpen, label: 'Meros va Qadriyatlar', shortLabel: 'Meros' },
  { id: 'schedule', icon: Calendar, label: 'Taqvim', shortLabel: 'Taqvim' },
  { id: 'messages', icon: MessageSquare, label: 'Muloqot', shortLabel: 'Muloqot' },
  { id: 'career', icon: GraduationCap, label: "Kasbiy Yo'l", shortLabel: 'Kasb' },
  { id: 'settings', icon: UserCircle, label: 'Profil & Boshqaruv', shortLabel: 'Boshqaruv' },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState(ROLES.TEACHER);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("Meros izidan");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [eqNotes, setEqNotes] = useState<EQNote[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newMood, setNewMood] = useState('Neutral');
  const [newScore, setNewScore] = useState<number | ''>('');
  const [newScoreSubject, setNewScoreSubject] = useState('Meros izidan');
  
  const DEFAULT_SUBJECTS = [
    "Meros izidan",
    "Men qanday yo‘l tutaman?",
    "Ezgu ishlarim",
    "O‘zimga nazar",
    "Amaliy topshiriqlar"
  ];

  const SCHEDULE_CURRICULUM_PRESETS = [
    "Meros izidan: Matn tahlili",
    "Men qanday yo‘l tutaman?: Tanlov",
    "Ezgu ishlarim: Amaliy tahlil",
    "O‘zimga nazar: Refleksiya",
    "Amaliy topshiriqlar"
  ];
  
  const [curriculumStats, setCurriculumStats] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiEqAdvice, setAiEqAdvice] = useState<string | null>(null);
  const [aiMediation, setAiMediation] = useState<string | null>(null);
  const [careerSuggestions, setCareerSuggestions] = useState<CareerSuggestion[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Admin state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentUsername, setNewParentUsername] = useState('');
  const [newParentPassword, setNewParentPassword] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<number | ''>('');
  
  // Student & Teacher credentials management
  const [editingStudentCredentials, setEditingStudentCredentials] = useState<{ id: number, name: string, username: string, password: string } | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [submissions, setSubmissions] = useState<ExerciseSubmission[]>([]);

  // Teachers management state for Admin
  const [teachers, setTeachers] = useState<User[]>([]);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherUsername, setNewTeacherUsername] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<{ id: number, name: string, username: string, password: string } | null>(null);

  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number, type: 'student' | 'parent' | 'teacher' } | null>(null);

  // Schedule state
  const [newScheduleDay, setNewScheduleDay] = useState('Dushanba');
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [newScheduleSubject, setNewScheduleSubject] = useState('Meros izidan: Matn tahlili');
  const [isExportingSchedule, setIsExportingSchedule] = useState<'pdf' | 'image' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, role]);

  const fetchData = async () => {
    if (!currentUser) return;
    const studentsData = await fetch('/api/students').then(res => res.json());
    setStudents(studentsData);
    
    if (studentsData.length > 0) {
      if (currentUser.role === ROLES.STUDENT) {
        const myStudent = studentsData.find((s: Student) => 
          s.id === currentUser.studentId || 
          s.username === currentUser.username || 
          s.name === currentUser.name
        ) || studentsData[0];
        setSelectedStudent(myStudent);
      } else if (!selectedStudent) {
        setSelectedStudent(studentsData[0]);
      }
    }

    const parentsData = await fetch('/api/users/parents').then(res => res.json());
    setParents(parentsData);

    const teachersData = await fetch('/api/users/teachers').then(res => res.json());
    setTeachers(teachersData);

    const exercisesData = await fetch('/api/exercises').then(res => res.json());
    setExercises(exercisesData);

    const submissionsUrl = (currentUser.role === ROLES.STUDENT && (currentUser.studentId || selectedStudent?.id))
      ? `/api/exercises/submissions/${currentUser.studentId || selectedStudent?.id}`
      : '/api/exercises/submissions';
    const submissionsData = await fetch(submissionsUrl).then(res => res.json());
    setSubmissions(submissionsData);

    const msgs = await fetch(`/api/messages/${currentUser.id}`).then(res => res.json());
    setMessages(msgs);

    const scheduleData = await fetch('/api/schedule').then(res => res.json());
    setSchedule(scheduleData);

    try {
      const stats = await fetch('/api/admin/curriculum-stats').then(res => res.json());
      setCurriculumStats(stats);
    } catch (e) {
      console.error("Error loading curriculum stats:", e);
    }

    // For simplicity, we'll just fetch the first other user for now
    const otherUserId = (role === ROLES.TEACHER || role === ROLES.ADMIN) ? 2 : 1; 
    const otherUserData = await fetch(`/api/users/${otherUserId}`).then(res => res.json());
    setOtherUser(otherUserData);
  };

  useEffect(() => {
    if (selectedStudent) {
      fetch(`/api/performance/${selectedStudent.id}`)
        .then(res => res.json())
        .then(data => {
          setPerformance(data);
          const uniqueSubjects = Array.from(new Set(data.map((p: any) => p.subject))) as string[];
          const finalSubjects = uniqueSubjects.length > 0 ? uniqueSubjects : DEFAULT_SUBJECTS;
          setSubjects(finalSubjects);
          if (finalSubjects.length > 0 && !finalSubjects.includes(selectedSubject)) {
            setSelectedSubject(finalSubjects[0]);
          }
        });
      
      fetch(`/api/eq-notes/${selectedStudent.id}`)
        .then(res => res.json())
        .then(setEqNotes);
    }
  }, [selectedStudent]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        setRole(user.role);
        setIsLoggedIn(true);
      } else {
        const data = await res.json();
        setLoginError(data.error || "Login yoki parol noto'g'ri");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Tizimga kirishda xatolik yuz berdi");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setPassword('');
    setActiveTab('dashboard');
    setIsMobileMenuOpen(false);
    setNotification({ message: "Tizimdan muvaffaqiyatli chiqildi", type: 'success' });
  };

  const handleAddParent = async () => {
    if (!newParentName || !newParentEmail || !newParentUsername || !newParentPassword) {
      setNotification({ message: "Iltimos, ota-ona ma'lumotlarini to'liq kiriting", type: 'error' });
      return;
    }
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newParentName, 
        email: newParentEmail, 
        role: 'parent',
        username: newParentUsername,
        password: newParentPassword
      })
    });
    if (res.ok) {
      const data = await res.json();
      setNewParentName('');
      setNewParentEmail('');
      setNewParentUsername('');
      setNewParentPassword('');
      await fetchData();
      setSelectedParentId(data.id);
      setNotification({ message: "Ota-ona muvaffaqiyatli qo'shildi", type: 'success' });
    } else {
      const data = await res.json();
      setNotification({ message: data.error || "Xatolik yuz berdi", type: 'error' });
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName || !currentUser) {
      setNotification({ message: "Iltimos, o'quvchi ismini kiriting", type: 'error' });
      return;
    }

    let parentId = selectedParentId;

    // If parent fields are filled, create the parent first
    if (!parentId && newParentName && newParentEmail && newParentUsername && newParentPassword) {
      const parentRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newParentName, 
          email: newParentEmail, 
          role: 'parent',
          username: newParentUsername,
          password: newParentPassword
        })
      });
      
      if (parentRes.ok) {
        const parentData = await parentRes.json();
        parentId = parentData.id;
        setNewParentName('');
        setNewParentEmail('');
        setNewParentUsername('');
        setNewParentPassword('');
      } else {
        const data = await parentRes.json();
        setNotification({ message: `Ota-onani qo'shishda xato: ${data.error}`, type: 'error' });
        return;
      }
    }

    if (!parentId) {
      setNotification({ message: "Iltimos, ota-onani tanlang yoki yangi ota-ona ma'lumotlarini kiriting", type: 'error' });
      return;
    }

    const res = await fetch('/api/students/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newStudentName, 
        parentId: parentId, 
        teacherId: (role === ROLES.ADMIN && teachers.length > 0) ? teachers[0].id : currentUser.id,
        username: newStudentUsername,
        password: newStudentPassword
      })
    });
    if (res.ok) {
      setNewStudentName('');
      setNewStudentUsername('');
      setNewStudentPassword('');
      setShowAddStudent(false);
      setSelectedParentId('');
      await fetchData();
      setNotification({ message: "O'quvchi muvaffaqiyatli qo'shildi va login-parol biriktirildi", type: 'success' });
    } else {
      const data = await res.json();
      setNotification({ message: data.error || "Xatolik yuz berdi", type: 'error' });
    }
  };

  const handleUpdateStudentCredentials = async (studentId: number, usernameVal: string, passwordVal: string) => {
    if (!usernameVal || !passwordVal) {
      setNotification({ message: "Iltimos, login va parolni to'liq kiriting", type: 'error' });
      return;
    }
    try {
      const res = await fetch(`/api/students/${studentId}/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameVal, password: passwordVal })
      });
      if (res.ok) {
        setEditingStudentCredentials(null);
        await fetchData();
        setNotification({ message: "O'quvchi login va paroli muvaffaqiyatli saqlandi!", type: 'success' });
      } else {
        const data = await res.json();
        setNotification({ message: data.error || "Xatolik yuz berdi", type: 'error' });
      }
    } catch (e) {
      setNotification({ message: "Server bilan bog'lanishda xatolik yuz berdi", type: 'error' });
    }
  };

  const handleSendNote = async () => {
    if (!selectedStudent || !newNote || !currentUser) return;
    const res = await fetch('/api/eq-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: selectedStudent.id,
        teacherId: currentUser.id,
        note: newNote,
        mood: newMood
      })
    });
    if (res.ok) {
      setNewNote('');
      const updatedNotes = await fetch(`/api/eq-notes/${selectedStudent.id}`).then(r => r.json());
      setEqNotes(updatedNotes);
    }
  };

  const handleAddScore = async () => {
    if (!selectedStudent || newScore === '' || !newScoreSubject) return;
    const res = await fetch('/api/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: selectedStudent.id,
        subject: newScoreSubject,
        score: Number(newScore),
        month: new Date().toLocaleString('uz-UZ', { month: 'long' })
      })
    });
    if (res.ok) {
      setNewScore('');
      // Refresh performance data
      fetch(`/api/performance/${selectedStudent.id}`)
        .then(res => res.json())
        .then(data => {
          setPerformance(data);
          const uniqueSubjects = Array.from(new Set(data.map((p: any) => p.subject))) as string[];
          setSubjects(uniqueSubjects.length > 0 ? uniqueSubjects : DEFAULT_SUBJECTS);
        });
    }
  };

  const handleDeleteStudent = async (id: number) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedStudent?.id === id) setSelectedStudent(null);
        await fetchData();
        setNotification({ message: "O'quvchi tizimdan o'chirildi", type: 'success' });
      } else {
        const data = await res.json();
        setNotification({ message: data.error || "Xatolik yuz berdi", type: 'error' });
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      setNotification({ message: "Xatolik yuz berdi", type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDeleteParent = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        setNotification({ message: "Ota-ona tizimdan o'chirildi", type: 'success' });
      } else {
        const data = await res.json();
        setNotification({ message: data.error || "Xatolik yuz berdi", type: 'error' });
      }
    } catch (error) {
      console.error("Error deleting parent:", error);
      setNotification({ message: "Xatolik yuz berdi", type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacherName || !newTeacherEmail || !newTeacherUsername || !newTeacherPassword) {
      setNotification({ message: "Iltimos, o'qituvchi ma'lumotlarini to'liq kiriting", type: 'error' });
      return;
    }
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newTeacherName, 
        email: newTeacherEmail, 
        role: 'teacher',
        username: newTeacherUsername,
        password: newTeacherPassword
      })
    });
    if (res.ok) {
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherUsername('');
      setNewTeacherPassword('');
      await fetchData();
      setNotification({ message: "O'qituvchi muvaffaqiyatli qo'shildi va login-parol berildi", type: 'success' });
    } else {
      const data = await res.json();
      setNotification({ message: data.error || "Xatolik yuz berdi", type: 'error' });
    }
  };

  const handleUpdateTeacherCredentials = async () => {
    if (!editingTeacher || !editingTeacher.username || !editingTeacher.password) {
      setNotification({ message: "Login va parolni to'liq kiriting", type: 'error' });
      return;
    }
    const res = await fetch(`/api/users/${editingTeacher.id}/credentials`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: editingTeacher.username, 
        password: editingTeacher.password 
      })
    });
    if (res.ok) {
      setEditingTeacher(null);
      await fetchData();
      setNotification({ message: "Ustozning login va paroli muvaffaqiyatli yangilandi", type: 'success' });
    } else {
      const data = await res.json();
      setNotification({ message: data.error || "Xatolik yuz berdi", type: 'error' });
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        setNotification({ message: "O'qituvchi tizimdan o'chirildi", type: 'success' });
      } else {
        const data = await res.json();
        setNotification({ message: data.error || "Xatolik yuz berdi", type: 'error' });
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
      setNotification({ message: "Xatolik yuz berdi", type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };
  const handleAddSchedule = async () => {
    if (!newScheduleDay || !newScheduleTime || !newScheduleSubject || !currentUser) return;
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day: newScheduleDay,
        time: newScheduleTime,
        subject: newScheduleSubject,
        teacher_id: currentUser.id
      })
    });
    if (res.ok) {
      setNewScheduleTime('');
      const updatedSchedule = await fetch('/api/schedule').then(r => r.json());
      setSchedule(updatedSchedule);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    const res = await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const updatedSchedule = await fetch('/api/schedule').then(r => r.json());
      setSchedule(updatedSchedule);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingSchedule('pdf');
      const studentName = role === ROLES.STUDENT ? currentUser?.name : (selectedStudent?.name || undefined);
      await downloadScheduleAsPDF(schedule, studentName);
      setNotification({ message: "Dars jadvali PDF formatida muvaffaqiyatli yuklab olindi!", type: 'success' });
    } catch (err) {
      console.error("PDF export error:", err);
      setNotification({ message: "PDF yuklab olishda xatolik yuz berdi", type: 'error' });
    } finally {
      setIsExportingSchedule(null);
    }
  };

  const handleExportImage = async () => {
    try {
      setIsExportingSchedule('image');
      const studentName = role === ROLES.STUDENT ? currentUser?.name : (selectedStudent?.name || undefined);
      await downloadScheduleAsImage(schedule, studentName);
      setNotification({ message: "Dars jadvali rasm (PNG) formatida muvaffaqiyatli yuklab olindi!", type: 'success' });
    } catch (err) {
      console.error("Image export error:", err);
      setNotification({ message: "Rasm yuklab olishda xatolik yuz berdi", type: 'error' });
    } finally {
      setIsExportingSchedule(null);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage || !currentUser || !otherUser) return;
    const senderId = currentUser.id;
    const receiverId = otherUser.id;
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId,
        receiverId,
        content: newMessage
      })
    });
    if (res.ok) {
      setNewMessage('');
      const updatedMessages = await fetch(`/api/messages/${senderId}`).then(r => r.json());
      setMessages(updatedMessages);
    }
  };

  const runAiAnalysis = async () => {
    setLoading(true);
    try {
      if (performance.length > 0) {
        const analysis = await analyzePerformance(performance);
        setAiAnalysis(analysis || null);
      }
      if (eqNotes.length > 0) {
        const advice = await analyzeEQ(eqNotes);
        setAiEqAdvice(advice || null);
      }
      if (currentUser) {
        const currentMessages = await fetch(`/api/messages/${currentUser.id}`).then(res => res.json());
        if (currentMessages.length > 0) {
          const mediation = await mediateChat(currentMessages);
          setAiMediation(mediation || null);
        }
      }
      const suggestions = await suggestCareerPath(subjects.length > 0 ? subjects : ['Matematika', 'O\'qish', 'Ona tili']);
      setCareerSuggestions(suggestions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editName || !currentUser) return;
    const res = await fetch(`/api/users/${currentUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName })
    });
    if (res.ok) {
      setCurrentUser({ ...currentUser, name: editName });
      setEditName('');
      setNotification({ message: "Ism muvaffaqiyatli o'zgartirildi", type: 'success' });
    }
  };

  const handleUpdateCredentials = async () => {
    if (!editUsername || !editPassword || !currentUser) {
      setNotification({ message: "Iltimos, yangi login va parolni kiriting", type: 'error' });
      return;
    }
    const res = await fetch(`/api/users/${currentUser.id}/credentials`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: editUsername, password: editPassword })
    });
    if (res.ok) {
      setCurrentUser({ ...currentUser, username: editUsername, password: editPassword });
      setEditUsername('');
      setEditPassword('');
      setNotification({ message: "Login va parol muvaffaqiyatli o'zgartirildi", type: 'success' });
    } else {
      const data = await res.json();
      setNotification({ message: data.error || "Xatolik yuz berdi", type: 'error' });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen meros-login-bg flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Soft ambient overlay */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-md rounded-3xl sm:rounded-[40px] p-6 sm:p-10 w-full max-w-lg shadow-2xl relative z-10 overflow-hidden border border-white/40"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-emerald-500" />
          <div className="text-center mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-4 sm:mb-6 shadow-xl shadow-indigo-200">
              <BrainCircuit size={36} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Meros Tafakkur</h1>
            <p className="text-slate-500 mt-1 sm:mt-2 text-sm sm:text-base font-medium">Qadriyatlarga Asoslangan Ta'lim Ekotizimi</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <p className="text-center text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Tizimga kirish</p>
            
            {loginError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs sm:text-sm font-medium flex items-center gap-2">
                <ShieldAlert size={18} />
                {loginError}
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Login yoki Email</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin yoki Ustoz1"
                  className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Parol</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 sm:py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              Kirish <ChevronRight size={18} />
            </button>

            <div className="pt-2">
              <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Tizimga tez kirish</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button 
                  type="button"
                  onClick={() => { setUsername('admin'); setPassword('admin'); }}
                  className="p-3 bg-indigo-50/80 hover:bg-indigo-100 text-slate-800 rounded-2xl text-left transition-all border border-indigo-100/60 cursor-pointer"
                >
                  <div className="font-bold flex items-center gap-1.5 text-indigo-700 text-xs">
                    <ShieldCheck size={14} /> Admin
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Login: <span className="font-mono font-bold text-indigo-600">admin</span></div>
                  <div className="text-[11px] text-slate-500">Parol: <span className="font-mono font-bold text-indigo-600">admin</span></div>
                </button>
                <button 
                  type="button"
                  onClick={() => { setUsername('Ustoz1'); setPassword('Ustoz1'); }}
                  className="p-3 bg-emerald-50/80 hover:bg-emerald-100 text-slate-800 rounded-2xl text-left transition-all border border-emerald-100/60 cursor-pointer"
                >
                  <div className="font-bold flex items-center gap-1.5 text-emerald-700 text-xs">
                    <GraduationCap size={14} /> Ustoz
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Login: <span className="font-mono font-bold text-emerald-600">Ustoz1</span></div>
                  <div className="text-[11px] text-slate-500">Parol: <span className="font-mono font-bold text-emerald-600">Ustoz1</span></div>
                </button>
                <button 
                  type="button"
                  onClick={() => { setUsername('jasur1'); setPassword('jasur123'); }}
                  className="p-3 bg-amber-50/80 hover:bg-amber-100 text-slate-800 rounded-2xl text-left transition-all border border-amber-100/60 cursor-pointer"
                >
                  <div className="font-bold flex items-center gap-1.5 text-amber-700 text-xs">
                    <BookOpen size={14} /> O'quvchi
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Login: <span className="font-mono font-bold text-amber-700">jasur1</span></div>
                  <div className="text-[11px] text-slate-500">Parol: <span className="font-mono font-bold text-amber-700">jasur123</span></div>
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
            <ShieldAlert size={15} />
            <p className="text-xs font-medium">Xavfsiz va maxfiy ma'lumotlar kafolatlangan</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen meros-bg-pattern text-slate-900 font-sans relative">
      {/* Student Edit Credentials Modal for Admin and Teacher */}
      <AnimatePresence>
        {editingStudentCredentials && (
          <StudentCredentialsModal
            editingStudent={editingStudentCredentials}
            onClose={() => setEditingStudentCredentials(null)}
            onSave={(studentId, uName, pWord) => handleUpdateStudentCredentials(studentId, uName, pWord)}
          />
        )}
      </AnimatePresence>

      {/* Teacher Edit Credentials Modal for Admin */}
      <AnimatePresence>
        {editingTeacher && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-5">
                <Key size={26} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">Ustozga Login va Parol Berish</h3>
              <p className="text-slate-500 text-sm mb-6">
                <span className="font-semibold text-slate-800">{editingTeacher.name}</span> uchun yangi login va parol belgilang.
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Login</label>
                  <input 
                    type="text" 
                    value={editingTeacher.username}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, username: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Masalan: ustoz2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Yangi Parol</label>
                  <input 
                    type="text" 
                    value={editingTeacher.password}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Masalan: Ustoz123!"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingTeacher(null)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm"
                >
                  Bekor qilish
                </button>
                <button 
                  onClick={handleUpdateTeacherCredentials}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-sm"
                >
                  Saqlash
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Ishonchingiz komilmi?</h3>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                Ushbu {deleteConfirm.type === 'student' ? "o'quvchini" : deleteConfirm.type === 'parent' ? "ota-onani" : "o'qituvchini (ustozni)"} tizimdan butunlay o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Bekor qilish
                </button>
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'student') handleDeleteStudent(deleteConfirm.id);
                    else if (deleteConfirm.type === 'parent') handleDeleteParent(deleteConfirm.id);
                    else handleDeleteTeacher(deleteConfirm.id);
                  }}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                >
                  O'chirish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              notification.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {notification.type === 'success' ? <Sparkles size={20} /> : <ShieldAlert size={20} />}
            <p className="font-bold text-sm">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-all">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (hidden on mobile, visible on lg+) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/80 p-6 flex-col gap-8 z-40 hidden lg:flex shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900">Meros Tafakkur</h1>
            <p className="text-[10px] text-slate-400 font-medium">Qadriyatlar Ekotizimi</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          {NAV_CONFIG.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-semibold cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-600 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span>
                    {item.id === 'exercises' && (role === ROLES.TEACHER || role === ROLES.ADMIN)
                      ? 'Meros & Qadriyatlar'
                      : item.label}
                  </span>
                </div>
                {item.id === 'exercises' && (role === ROLES.TEACHER || role === ROLES.ADMIN) && curriculumStats?.deedsPending > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500 text-white animate-pulse" title="Tasdiq kutilayotgan ezgu amallar">
                    {curriculumStats.deedsPending}
                  </span>
                )}
                {item.id === 'exercises' && role === ROLES.STUDENT && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                    Faol
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-3">Hozirgi foydalanuvchi</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                {currentUser?.name?.[0] || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">
                  {role === ROLES.ADMIN ? 'Administrator' : role === ROLES.TEACHER ? 'Sinf Rahbari' : role === ROLES.STUDENT ? "O'quvchi" : role === ROLES.PARENT ? 'Ota-ona' : 'Psixolog'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full mt-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-rose-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={15} />
              Tizimdan Chiqish
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (visible when isMobileMenuOpen is true on <lg) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-72 max-w-[85vw] h-full bg-white border-r border-slate-200 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto z-10"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
                      <BrainCircuit size={24} />
                    </div>
                    <div>
                      <h1 className="font-bold text-xl tracking-tight text-slate-900">Meros Tafakkur</h1>
                      <p className="text-[10px] text-slate-400 font-medium">Qadriyatlar Ekotizimi</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="flex flex-col gap-1.5">
                  {NAV_CONFIG.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-sm font-semibold cursor-pointer ${
                          isActive 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={19} />
                          <span>
                            {item.id === 'exercises' && (role === ROLES.TEACHER || role === ROLES.ADMIN)
                              ? 'Meros & Qadriyatlar'
                              : item.label}
                          </span>
                        </div>
                        {item.id === 'exercises' && (role === ROLES.TEACHER || role === ROLES.ADMIN) && curriculumStats?.deedsPending > 0 && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white'
                          }`}>
                            {curriculumStats.deedsPending} tasdiq
                          </span>
                        )}
                        {item.id === 'exercises' && role === ROLES.STUDENT && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            Yangi
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2.5">Joriy hisob</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">
                      {currentUser?.name?.[0] || 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">
                        {role === ROLES.ADMIN ? 'Administrator' : role === ROLES.TEACHER ? 'Sinf Rahbari' : role === ROLES.STUDENT ? "O'quvchi" : 'Ota-ona'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-rose-100 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={14} /> Tizimdan Chiqish
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Top Header (visible only on <lg) */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-1.5 text-slate-700 hover:bg-slate-100 active:scale-95 rounded-xl transition-all cursor-pointer"
            aria-label="Menyuni ochish"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <BrainCircuit size={18} />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">Meros Tafakkur</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {role === ROLES.STUDENT && (
            <button
              onClick={() => setActiveTab('exercises')}
              className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <BookOpen size={13} /> Meros
            </button>
          )}
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 rounded-full border border-slate-200 transition-all text-xs font-bold text-slate-700 cursor-pointer"
          >
            <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
              {currentUser?.name?.[0] || 'U'}
            </span>
            <span className="max-w-[75px] truncate text-[11px]">{currentUser?.name?.split(' ')[0]}</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (visible only on <lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 py-1.5 flex justify-around items-center shadow-lg shadow-slate-900/10">
        {NAV_CONFIG.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all relative flex-1 cursor-pointer ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 scale-105' : ''}`}>
                <item.icon size={19} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                {item.shortLabel}
              </span>
              {item.id === 'exercises' && role === ROLES.STUDENT && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 min-h-screen">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Xush kelibsiz, {currentUser?.name}</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              {role === ROLES.STUDENT 
                ? "Bugungi qadriyatlar tahlili va ezgu amallarni bajarishga tayyormisiz?" 
                : "Bugungi ta'lim ekotizimi holati bilan tanishing."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {role === ROLES.STUDENT && (
              <button 
                onClick={() => setActiveTab('exercises')}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all text-xs sm:text-sm cursor-pointer"
              >
                <BookOpen size={17} /> Meros va Qadriyatlar
              </button>
            )}
            <a 
              href="/meros-tafakkur-loyiha-kodi.zip"
              download="meros-tafakkur-loyiha-kodi.zip"
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl font-bold shadow-xs hover:border-slate-300 transition-all text-xs sm:text-sm cursor-pointer active:scale-95"
              title="Loyiha kodlarini to'liq ZIP arxiv ko'rinishida yuklab olish"
            >
              <Download size={17} className="text-indigo-600" />
              <span>Kodlarni Yuklab Olish (.ZIP)</span>
            </a>
            <button 
              onClick={runAiAnalysis}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-2xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
            >
              {loading ? <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent" /> : <Sparkles size={18} />}
              AI Analizni yangilash
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-6"
            >
              {/* Teacher & Admin Curriculum Command Center (Dastur Nazorati & Qadriyatlar Paneli) */}
              {(role === ROLES.TEACHER || role === ROLES.ADMIN) && (
                <div className="col-span-12">
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-indigo-200 text-xs font-semibold mb-2.5 border border-white/10">
                          <Sparkles size={14} className="text-amber-300" />
                          <span>{role === ROLES.ADMIN ? "Admin Boshqaruv Markazi" : "Sinf Rahbari Paneli"} • Dastur Holati</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                          Meros Tafakkur Dasturi Nazorati
                        </h2>
                        <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                          O'quvchilarning milliy qadriyatlar, matnlar tahlili va amaliy ezgu amallardagi faolligini monitoring qiling hamda baholang.
                        </p>
                      </div>

                      {/* Quick action buttons for Teacher/Admin */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          onClick={() => setActiveTab('exercises')}
                          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                            curriculumStats?.deedsPending > 0
                              ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <HeartHandshake size={16} />
                          <span>
                            {curriculumStats?.deedsPending > 0
                              ? `${curriculumStats.deedsPending} ta Ezgu Amalni Tasdiqlash`
                              : "Ezgu Ishlar Monitoringi"}
                          </span>
                        </button>

                        <button
                          onClick={() => setActiveTab('exercises')}
                          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                        >
                          <PlusCircle size={16} /> Yangi Material Qo‘shish
                        </button>
                      </div>
                    </div>

                    {/* 4 Program Module Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
                      <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/10">
                        <div className="flex items-center gap-2 text-indigo-300 mb-1">
                          <ScrollText size={16} />
                          <span className="text-[11px] font-bold">1. Meros izidan</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-white">{curriculumStats?.heritageSubs ?? 0} ta</p>
                        <p className="text-[10px] text-indigo-200 mt-0.5">Topshirilgan tahlillar</p>
                      </div>

                      <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/10">
                        <div className="flex items-center gap-2 text-blue-300 mb-1">
                          <Compass size={16} />
                          <span className="text-[11px] font-bold">2. Axloqiy tanlov</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-white">{curriculumStats?.moralChoices ?? 0} ta</p>
                        <p className="text-[10px] text-blue-200 mt-0.5">Qarorlar zanjiri</p>
                      </div>

                      <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/10">
                        <div className="flex items-center gap-2 text-emerald-300 mb-1">
                          <HeartHandshake size={16} />
                          <span className="text-[11px] font-bold">3. Ezgu ishlar</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-xl sm:text-2xl font-black text-white">{curriculumStats?.deedsTotal ?? 0} ta</p>
                          {curriculumStats?.deedsPending > 0 && (
                            <span className="text-[10px] bg-amber-400 text-slate-900 font-bold px-1.5 py-0.2 rounded-md">
                              {curriculumStats.deedsPending} kutilmoqda
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-emerald-200 mt-0.5">Tasdiqlangan: {curriculumStats?.deedsVerified ?? 0} ta</p>
                      </div>

                      <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/10">
                        <div className="flex items-center gap-2 text-amber-300 mb-1">
                          <Users size={16} />
                          <span className="text-[11px] font-bold">O'quvchilar</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-white">{students.length} nafar</p>
                        <p className="text-[10px] text-amber-200 mt-0.5">Dasturda faol qatnashuvchilar</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Student Selector & Admin / Student Info */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                {role === ROLES.STUDENT ? (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                      <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-100">
                        {currentUser?.name?.[0] || 'O'}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-slate-900">{currentUser?.name}</h3>
                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-100">
                          O'quvchi hisobi
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-slate-50 rounded-2xl flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Ustoz:</span>
                        <span className="font-bold text-slate-800">{selectedStudent?.teacher_name || "Biriktirilmagan"}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Ota-ona:</span>
                        <span className="font-bold text-slate-800">{selectedStudent?.parent_name || "Biriktirilmagan"}</span>
                      </div>
                      <div className="p-3 bg-indigo-50/70 rounded-2xl flex justify-between items-center border border-indigo-100/60">
                        <span className="text-indigo-600 font-medium">Login:</span>
                        <span className="font-mono font-bold text-indigo-900">{currentUser?.username}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200/60">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
                        <Trophy size={18} /> Topshiriqlar Natijalari
                      </div>
                      <p className="text-xs text-amber-700">
                        Bajarilgan mashqlar: <strong>{submissions.length} ta</strong>
                      </p>
                      <button
                        onClick={() => setActiveTab('exercises')}
                        className="mt-3 w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <BookOpen size={14} /> Mashqlarni Bajarish
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-bold text-xs border border-rose-200/70 transition-all flex items-center justify-center gap-2"
                      >
                        <LogOut size={15} /> Tizimdan Chiqish
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <UserCircle className="text-indigo-600" /> O'quvchilar
                      </h3>
                      {(role === ROLES.TEACHER || role === ROLES.ADMIN) && (
                        <button 
                          onClick={() => setShowAddStudent(!showAddStudent)}
                          className="p-2 hover:bg-slate-50 rounded-xl text-indigo-600 transition-all"
                          title="Yangi o'quvchi qo'shish"
                        >
                          <PlusCircle size={20} />
                        </button>
                      )}
                    </div>

                    {showAddStudent && (role === ROLES.TEACHER || role === ROLES.ADMIN) && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4"
                      >
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Yangi o'quvchi qo'shish va login-parol berish</p>
                        <input 
                          type="text" 
                          placeholder="O'quvchi ismi (F.I.SH)"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            placeholder="Login (masalan: jasur1)"
                            value={newStudentUsername}
                            onChange={(e) => setNewStudentUsername(e.target.value)}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                          />
                          <input 
                            type="text" 
                            placeholder="Parol (masalan: jasur123)"
                            value={newStudentPassword}
                            onChange={(e) => setNewStudentPassword(e.target.value)}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                          />
                        </div>
                        
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Ota-ona tanlash yoki qo'shish</p>
                          <select 
                            value={selectedParentId}
                            onChange={(e) => setSelectedParentId(Number(e.target.value))}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm mb-3"
                          >
                            <option value="">Ota-onani tanlang</option>
                            {parents.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                            ))}
                          </select>
                          
                          <div className="space-y-2">
                            <input 
                              type="text" 
                              placeholder="Yangi ota-ona ismi"
                              value={newParentName}
                              onChange={(e) => setNewParentName(e.target.value)}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                            />
                            <input 
                              type="email" 
                              placeholder="Email"
                              value={newParentEmail}
                              onChange={(e) => setNewParentEmail(e.target.value)}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="text" 
                                placeholder="Login"
                                value={newParentUsername}
                                onChange={(e) => setNewParentUsername(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                              />
                              <input 
                                type="password" 
                                placeholder="Parol"
                                value={newParentPassword}
                                onChange={(e) => setNewParentPassword(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                              />
                            </div>
                            <button 
                              onClick={handleAddParent}
                              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                            >
                              Ota-onani ro'yxatga olish
                            </button>
                          </div>
                        </div>

                        <button 
                          onClick={handleAddStudent}
                          className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100"
                        >
                          O'quvchini saqlash va login berish
                        </button>
                      </motion.div>
                    )}

                    <div className="flex flex-col gap-3">
                      {students.map(s => (
                        <div key={s.id} className="group relative">
                          <div
                            onClick={() => setSelectedStudent(s)}
                            className={`w-full p-4 rounded-2xl border transition-all cursor-pointer ${
                              selectedStudent?.id === s.id 
                                ? 'border-indigo-600 bg-indigo-50/50' 
                                : 'border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                                  {s.name[0]}
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-slate-800">{s.name}</p>
                                  <p className="text-xs text-slate-400">Ota-ona: {s.parent_name || "—"}</p>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-slate-300" />
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-400 font-semibold">Login:</span>
                                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/60">
                                  {s.username || '—'}
                                </span>
                              </div>
                              {(role === ROLES.TEACHER || role === ROLES.ADMIN) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingStudentCredentials({
                                      id: s.id,
                                      name: s.name,
                                      username: s.username || '',
                                      password: s.password || ''
                                    });
                                  }}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                  title="Login va parol berish"
                                >
                                  <Key size={12} /> Login/Parol
                                </button>
                              )}
                            </div>
                          </div>
                          {(role === ROLES.TEACHER || role === ROLES.ADMIN) && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: s.id, type: 'student' }); }}
                              className="absolute -right-2 -top-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                              title="O'chirish"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                  {/* EQ & Curriculum Monitoring (Teacher and Admin) */}
                  {(role === ROLES.TEACHER || role === ROLES.ADMIN) && (
                    <div className="mt-8 pt-6 border-t border-slate-100 space-y-8">
                      {/* Dastur Bo'yicha Baholash */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                            <Award size={16} className="text-indigo-600" /> Dastur Bo'yicha Baholash
                          </h4>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                            1-10 ball
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-3">
                          {selectedStudent ? `${selectedStudent.name}ni qadriyatli bo'limlar bo'yicha baholang:` : "O'quvchini qadriyatlar va mashqlar bo'yicha baholang:"}
                        </p>
                        <div className="space-y-2 mb-3">
                          <select 
                            value={newScoreSubject}
                            onChange={(e) => setNewScoreSubject(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            {DEFAULT_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <input 
                            type="number" 
                            placeholder="Ball (1-10 oralig'ida)"
                            max={10}
                            min={1}
                            value={newScore}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              if (val === '' || (val >= 0 && val <= 10)) {
                                setNewScore(val);
                              }
                            }}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <button 
                          onClick={handleAddScore}
                          className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 cursor-pointer active:scale-98"
                        >
                          <PlusCircle size={18} /> Bahoni saqlash
                        </button>
                      </div>

                      {/* EQ Notes */}
                      <div>
                        <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">EQ Monitoring</h4>
                        <div className="flex gap-2 mb-4">
                          {['Happy', 'Neutral', 'Sad'].map(m => (
                            <button
                              key={m}
                              onClick={() => setNewMood(m)}
                              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 border transition-all ${
                                newMood === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'
                              }`}
                            >
                              {m === 'Happy' && <Smile size={16} />}
                              {m === 'Neutral' && <Meh size={16} />}
                              {m === 'Sad' && <Frown size={16} />}
                              <span className="text-xs font-bold">{m}</span>
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Darsdagi faolligi haqida qisqa qayd..."
                          className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none h-24"
                        />
                        <button 
                          onClick={handleSendNote}
                          className="w-full mt-3 bg-slate-900 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                        >
                          <PlusCircle size={18} /> Qaydni saqlash
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>

              {/* Performance Chart */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-bold text-xl">Prediktiv Analitika</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-slate-500 text-sm">Oxirgi 3 oylik o'zlashtirish trendi.</p>
                        <select 
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-indigo-600 focus:outline-none"
                        >
                          {subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {aiAnalysis && (
                      <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-100">
                        <TrendingDown size={18} />
                        <span className="text-xs font-bold">AI Ogohlantirish</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performance.filter(p => p.subject === selectedSubject)}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {aiAnalysis && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100"
                    >
                      <div className="flex items-center gap-2 text-indigo-600 mb-3">
                        <Sparkles size={20} />
                        <span className="font-bold">AI Bashorati</span>
                      </div>
                      <div className="text-sm text-slate-700 leading-relaxed prose prose-indigo">
                        <Markdown>{aiAnalysis}</Markdown>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* EQ Advice (Parent Only) */}
                {role === ROLES.PARENT && aiEqAdvice && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/30"
                  >
                    <div className="flex items-center gap-3 text-emerald-600 mb-4">
                      <BrainCircuit size={24} />
                      <h3 className="font-bold text-xl">EQ Tavsiyalari</h3>
                    </div>
                    <div className="text-sm text-slate-700 leading-relaxed prose prose-emerald">
                      <Markdown>{aiEqAdvice}</Markdown>
                    </div>
                  </motion.div>
                )}

                {/* Dastur Bo'limlari Kesimida O'zlashtirish */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                      <BookOpen className="text-indigo-600" /> Dastur Bo'limlari Kesimida O'zlashtirish
                    </h3>
                    <span className="text-xs text-slate-400">Qadriyatlar va amaliyot ko'rsatkichlari</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {subjects.map(subject => {
                      const subjectData = performance.filter(p => p.subject === subject);
                      const latestScore = subjectData[subjectData.length - 1]?.score || 0;
                      const prevScore = subjectData[subjectData.length - 2]?.score || 0;
                      const diff = latestScore - prevScore;

                      const getMeta = (name: string) => {
                        if (name.includes("Meros")) return { icon: ScrollText, color: "text-indigo-600", bg: "bg-indigo-50", bar: "bg-indigo-600", desc: "Matnlar va hikmatlar tahlili" };
                        if (name.includes("yo‘l") || name.includes("yol")) return { icon: Compass, color: "text-blue-600", bg: "bg-blue-50", bar: "bg-blue-600", desc: "Axloqiy tanlov zanjirlari" };
                        if (name.includes("Ezgu")) return { icon: HeartHandshake, color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-600", desc: "Xayrli amallar kundaligi" };
                        if (name.includes("nazar")) return { icon: Eye, color: "text-purple-600", bg: "bg-purple-50", bar: "bg-purple-600", desc: "Refleksiya va o'zini anglash" };
                        return { icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50", bar: "bg-teal-600", desc: "Bilim va amaliy topshiriqlar" };
                      };

                      const meta = getMeta(subject);
                      const IconComp = meta.icon;

                      const getBadge = (sc: number) => {
                        if (sc >= 9) return { label: "A'lo daraja", cls: "bg-emerald-50 text-emerald-700 border-emerald-200/80" };
                        if (sc >= 7) return { label: "Yaxshi natija", cls: "bg-blue-50 text-blue-700 border-blue-200/80" };
                        if (sc >= 5) return { label: "O'rtacha", cls: "bg-amber-50 text-amber-700 border-amber-200/80" };
                        return { label: "Ko'proq mashq zarur", cls: "bg-rose-50 text-rose-700 border-rose-200/80" };
                      };
                      const badge = getBadge(latestScore);

                      return (
                        <div key={subject} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.color} shadow-xs`}>
                                  <IconComp size={20} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm">{subject}</h4>
                                  <p className="text-[11px] text-slate-400 mt-0.5">{meta.desc}</p>
                                </div>
                              </div>
                              <div className={`flex items-center gap-1 text-xs font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {diff >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {Math.abs(diff)} ball
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-end gap-1.5">
                                <span className="text-3xl font-black text-slate-900">{latestScore}</span>
                                <span className="text-xs text-slate-400 mb-1 font-semibold">/ 10 ball</span>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className={`${meta.bar} h-full rounded-full transition-all duration-1000`} 
                              style={{ width: `${Math.min(100, Math.max(0, latestScore * 10))}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              {/* Recent EQ Notes */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-lg mb-6">So'nggi EQ Qaydlar</h3>
                  <div className="space-y-4">
                    {eqNotes.map(note => (
                      <div key={note.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          note.mood === 'Happy' ? 'bg-emerald-100 text-emerald-600' :
                          note.mood === 'Sad' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {note.mood === 'Happy' ? <Smile size={24} /> : note.mood === 'Sad' ? <Frown size={24} /> : <Meh size={24} />}
                        </div>
                        <div>
                          <p className="text-sm text-slate-800 font-medium">{note.note}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold uppercase text-slate-400">{note.teacher_name}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400">{new Date(note.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-slate-900">Haftalik Taqvim</h2>
                    {role === ROLES.STUDENT && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-100 flex items-center gap-1">
                        <Calendar size={13} /> O'quvchi Jadvali
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 mt-1">Dars jadvali va muhim tadbirlar.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Yuklab olish tugmalari (PDF va Rasm) */}
                  <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm gap-1.5">
                    <button 
                      onClick={handleExportPDF}
                      disabled={isExportingSchedule !== null}
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-50 rounded-xl font-bold text-xs transition-all border border-rose-200/60 shadow-xs cursor-pointer"
                      title="Dars jadvalini PDF formatida yuklab olish"
                    >
                      {isExportingSchedule === 'pdf' ? (
                        <Loader2 size={15} className="animate-spin text-rose-600" />
                      ) : (
                        <FileText size={15} className="text-rose-600" />
                      )}
                      <span>PDF Yuklab Olish</span>
                    </button>

                    <button 
                      onClick={handleExportImage}
                      disabled={isExportingSchedule !== null}
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-50 rounded-xl font-bold text-xs transition-all border border-indigo-200/60 shadow-xs cursor-pointer"
                      title="Dars jadvalini rasm (PNG) formatida yuklab olish"
                    >
                      {isExportingSchedule === 'image' ? (
                        <Loader2 size={15} className="animate-spin text-indigo-600" />
                      ) : (
                        <ImageIcon size={15} className="text-indigo-600" />
                      )}
                      <span>Rasm (PNG)</span>
                    </button>
                  </div>

                  {(role === ROLES.TEACHER || role === ROLES.ADMIN) && (
                    <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                      <select 
                        value={newScheduleDay}
                        onChange={(e) => setNewScheduleDay(e.target.value)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        {["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input 
                        type="time" 
                        value={newScheduleTime}
                        onChange={(e) => setNewScheduleTime(e.target.value)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                      <select 
                        value={newScheduleSubject}
                        onChange={(e) => setNewScheduleSubject(e.target.value)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none max-w-[240px]"
                      >
                        {SCHEDULE_CURRICULUM_PRESETS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button 
                        onClick={handleAddSchedule}
                        className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition-all text-xs cursor-pointer shadow-sm active:scale-95"
                      >
                        <PlusCircle size={16} /> Qo'shish
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {role === ROLES.STUDENT && (
                <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 rounded-3xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-indigo-200 border border-white/10">
                      <Download size={22} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base">Haftalik Dars Jadvalini Yuklab Olish</h4>
                      <p className="text-xs text-indigo-200 mt-0.5">
                        Darslaringizni doimo yoningizda saqlash uchun PDF yoki rasm ko'rinishida yuklab oling.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleExportPDF}
                      disabled={isExportingSchedule !== null}
                      className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isExportingSchedule === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                      <span>PDF Yuklab Olish</span>
                    </button>
                    <button
                      onClick={handleExportImage}
                      disabled={isExportingSchedule !== null}
                      className="px-4 py-2.5 bg-white hover:bg-slate-100 active:scale-95 text-indigo-900 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isExportingSchedule === 'image' ? <Loader2 size={14} className="animate-spin text-indigo-600" /> : <ImageIcon size={14} className="text-indigo-600" />}
                      <span>Rasm (PNG) Yuklab Olish</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
                {["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"].map(day => (
                  <div key={day} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-slate-50 p-4 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-center">{day}</h3>
                    </div>
                    <div className="p-4 flex-1 space-y-3">
                      {schedule.filter(s => s.day === day).sort((a, b) => a.time.localeCompare(b.time)).map(item => (
                        <div key={item.id} className="group relative p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                          <div className="flex items-center gap-2 text-indigo-600 mb-1">
                            <Clock size={12} />
                            <span className="text-[10px] font-bold">{item.time}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800">{item.subject}</p>
                          {(role === ROLES.TEACHER || role === ROLES.ADMIN) && (
                            <button 
                              onClick={() => handleDeleteSchedule(item.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                      {schedule.filter(s => s.day === day).length === 0 && (
                        <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
                          <p className="text-[10px] text-slate-300 font-medium">Darslar yo'q</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-12 gap-6 min-h-[500px] h-[calc(100vh-210px)] lg:h-[calc(100vh-200px)]"
            >
              <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {otherUser?.name?.[0] || (role === ROLES.TEACHER ? 'O' : 'T')}
                    </div>
                    <div>
                      <p className="font-bold">{otherUser?.name || (role === ROLES.TEACHER ? 'Ota-ona' : 'O\'qituvchi')}</p>
                      <p className="text-xs text-emerald-500 font-medium">Online</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] sm:max-w-[70%] p-3.5 sm:p-4 rounded-2xl text-sm ${
                        msg.sender_id === currentUser?.id 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-slate-100 text-slate-800 rounded-tl-none'
                      }`}>
                        <p className="text-[10px] font-bold uppercase mb-1 opacity-70">
                          {msg.sender_id === currentUser?.id ? 'Siz' : msg.sender_name}
                        </p>
                        {msg.content}
                        <p className={`text-[10px] mt-2 ${msg.sender_id === currentUser?.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 sm:p-6 border-t border-slate-100 flex gap-2 sm:gap-3">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Xabar yozing..."
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="bg-indigo-600 text-white w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all shrink-0 cursor-pointer"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 text-indigo-600 mb-6">
                    <ShieldAlert size={24} />
                    <h3 className="font-bold text-xl">AI Mediator</h3>
                  </div>
                  
                  {aiMediation ? (
                    <div className="text-sm text-slate-700 leading-relaxed prose prose-indigo">
                      <Markdown>{aiMediation}</Markdown>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Sparkles size={32} />
                      </div>
                      <p className="text-slate-400 text-sm">Muloqotni tahlil qilish va nizolarni yumshatish uchun AI Mediatorni ishga tushiring.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'career' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-indigo-900 rounded-3xl sm:rounded-[40px] p-6 sm:p-12 text-white relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">Kasbiy Trayektoriya</h2>
                  <p className="text-indigo-200 text-sm sm:text-lg leading-relaxed">
                    O'quvchining qiziqishlari va o'zlashtirish ko'rsatkichlari asosida AI tomonidan tanlangan xalqaro imkoniyatlar.
                  </p>
                </div>
                <div className="absolute right-[-100px] top-[-100px] w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute left-[-50px] bottom-[-50px] w-[300px] h-[300px] bg-indigo-400/10 rounded-full blur-2xl" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {careerSuggestions.length > 0 ? (
                  careerSuggestions.map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                    >
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {item.type.includes('Olympiad') ? <Trophy size={28} /> : <BookOpen size={28} />}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2 block">{item.type}</span>
                      <h4 className="font-bold text-xl mb-4 text-slate-900">{item.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed mb-6">{item.description}</p>
                      <button className="flex items-center gap-2 text-indigo-600 font-bold text-sm group-hover:gap-3 transition-all cursor-pointer">
                        Batafsil <ChevronRight size={16} />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-16 sm:py-20 bg-slate-50 rounded-3xl sm:rounded-[40px] border border-dashed border-slate-200 p-6">
                    <Sparkles className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-medium text-sm sm:text-base">AI tavsiyalarini olish uchun "AI Analizni yangilash" tugmasini bosing.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'exercises' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ExercisesView 
                currentUser={currentUser}
                role={role}
                studentId={currentUser?.role === ROLES.STUDENT ? (currentUser.studentId || selectedStudent?.id || 1) : (selectedStudent?.id || 1)}
                exercises={exercises}
                submissions={submissions}
                onRefreshData={fetchData}
                onShowToast={(message, type) => setNotification({ message, type })}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="bg-white rounded-3xl sm:rounded-[40px] p-5 sm:p-10 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-10 pb-8 sm:pb-10 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-100 shrink-0">
                      {currentUser?.name[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{currentUser?.name}</h3>
                      <p className="text-slate-500 font-medium text-sm sm:text-base">
                        {role === ROLES.ADMIN ? 'Tizim Administratori' : role === ROLES.TEACHER ? 'Sinf Rahbari (Ustoz)' : role === ROLES.STUDENT ? "O'quvchi (Student)" : 'Ota-ona'}
                      </p>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">ID: {currentUser?.id}</span>
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">Login: {currentUser?.username}</span>
                        {role === ROLES.ADMIN && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                            <ShieldCheck size={12} /> Bosh Administrator
                          </span>
                        )}
                        {role === ROLES.STUDENT && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                            <BookOpen size={12} /> O'quvchi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm rounded-2xl border border-rose-200 transition-all shadow-sm w-full sm:w-auto cursor-pointer"
                  >
                    <LogOut size={18} />
                    Tizimdan Chiqish
                  </button>
                </div>

                {role === ROLES.STUDENT && (
                  <div className="mb-10 space-y-4">
                    <div className="p-8 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[32px] text-white shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <UserCircle size={24} className="text-indigo-300" />
                          <h4 className="text-xl font-bold">O'quvchi Tafsilotlari</h4>
                        </div>
                        <span className="text-xs bg-indigo-500/40 text-indigo-100 px-3 py-1 rounded-full font-bold border border-indigo-400/30">
                          Faol O'quvchi
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                          <p className="text-indigo-200 text-xs font-medium">Ustoz (Sinf rahbari):</p>
                          <p className="text-base font-bold text-white mt-1">{selectedStudent?.teacher_name || "Biriktirilmagan"}</p>
                          <p className="text-xs text-indigo-300 mt-0.5">{selectedStudent?.teacher_email || ""}</p>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                          <p className="text-indigo-200 text-xs font-medium">Ota-ona:</p>
                          <p className="text-base font-bold text-white mt-1">{selectedStudent?.parent_name || "Biriktirilmagan"}</p>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                          <p className="text-indigo-200 text-xs font-medium">Bajarilgan Mashqlar:</p>
                          <p className="text-base font-bold text-white mt-1">{submissions.length} ta topshirildi</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-rose-50/80 rounded-3xl border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center font-bold">
                          <LogOut size={22} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">O'quvchi Profilidan Chiqish</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Platformadan xavfsiz chiqish va yangi sessiya ochish</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-200 flex items-center justify-center gap-2 transition-all self-stretch sm:self-auto"
                      >
                        <LogOut size={18} />
                        Tizimdan Chiqish
                      </button>
                    </div>
                  </div>
                )}

                {role === ROLES.PARENT && selectedStudent && (
                  <div className="mb-10 p-8 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[32px] text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <UserCircle size={24} className="text-indigo-300" />
                      <h4 className="text-xl font-bold">Sinf Rahbari (Ustoz)</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                        {selectedStudent.teacher_name?.[0]}
                      </div>
                      <div>
                        <p className="text-lg font-bold">{selectedStudent.teacher_name}</p>
                        <p className="text-indigo-200 text-sm">{selectedStudent.teacher_email}</p>
                        <button 
                          onClick={() => setActiveTab('messages')}
                          className="mt-3 px-4 py-2 bg-white text-indigo-900 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all"
                        >
                          Xabar yozish
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-8">Profil Ma'lumotlari</h3>
                
                <div className="mb-10 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Ism va Familyangizni o'zgartirish</p>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Yangi ism sharifingiz"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 p-4 bg-white border border-indigo-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button 
                      onClick={handleUpdateName}
                      className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      Saqlash
                    </button>
                  </div>
                </div>

                <div className="mb-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Login va parolni o'zgartirish</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input 
                      type="text" 
                      placeholder="Yangi login"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="p-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input 
                      type="password" 
                      placeholder="Yangi parol"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="p-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <button 
                    onClick={handleUpdateCredentials}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                  >
                    Login va parolni saqlash
                  </button>
                </div>

                {/* Admin Dastur Boshqaruv & Monitoring Markazi */}
                {role === ROLES.ADMIN && (
                  <div className="mb-12 pb-10 border-b border-slate-200 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                          <BrainCircuit className="text-indigo-600" /> Dastur Boshqaruv Markazi (Meros Tafakkur Ekotizimi)
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Administrator paneli orqali ta'lim dasturining 5 ta asosiy bo'limi bo'yicha umumiy statistikani va faollikni kuzating.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('exercises')}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
                      >
                        <BookOpen size={16} /> Meros va Qadriyatlarni Boshqarish
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-5 bg-indigo-50/70 border border-indigo-100 rounded-3xl">
                        <div className="flex items-center gap-2 text-indigo-700 mb-2 font-bold text-xs">
                          <ScrollText size={18} /> 1. Meros izidan
                        </div>
                        <p className="text-2xl font-black text-slate-900">{curriculumStats?.heritageSubs || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">Topshirilgan matn tahlillari</p>
                      </div>

                      <div className="p-5 bg-blue-50/70 border border-blue-100 rounded-3xl">
                        <div className="flex items-center gap-2 text-blue-700 mb-2 font-bold text-xs">
                          <Compass size={18} /> 2. Axloqiy tanlov
                        </div>
                        <p className="text-2xl font-black text-slate-900">{curriculumStats?.moralChoices || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">Mustaqil qarorlar zanjiri</p>
                      </div>

                      <div className="p-5 bg-emerald-50/70 border border-emerald-100 rounded-3xl">
                        <div className="flex items-center gap-2 text-emerald-700 mb-2 font-bold text-xs">
                          <HeartHandshake size={18} /> 3. Ezgu ishlar
                        </div>
                        <p className="text-2xl font-black text-slate-900">{curriculumStats?.deedsTotal || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Tasdiqlangan: <strong>{curriculumStats?.deedsVerified || 0}</strong> ({curriculumStats?.deedsPending || 0} kutilmoqda)
                        </p>
                      </div>

                      <div className="p-5 bg-amber-50/70 border border-amber-100 rounded-3xl">
                        <div className="flex items-center gap-2 text-amber-700 mb-2 font-bold text-xs">
                          <CheckCircle2 size={18} /> Amaliy mashqlar
                        </div>
                        <p className="text-2xl font-black text-slate-900">{curriculumStats?.exercisesSubs || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">Bajarilgan topshiriqlar</p>
                      </div>
                    </div>

                    {/* Source Code Download Card */}
                    <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-900/60 shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-300 backdrop-blur-xs shrink-0">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-white">Dasturning To'liq Kodlari (ZIP Arxiv)</h4>
                          <p className="text-xs text-indigo-200 mt-0.5">
                            Frontend (React + Tailwind), Backend (Express + SQLite), xizmatlar va barcha resurslar to'liq jamlangan.
                          </p>
                        </div>
                      </div>
                      <a
                        href="/meros-tafakkur-loyiha-kodi.zip"
                        download="meros-tafakkur-loyiha-kodi.zip"
                        className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        <Download size={18} />
                        <span>Kodni Yuklab Olish (.ZIP)</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Teacher Dastur va Sinf Nazorati Qisqartmasi */}
                {role === ROLES.TEACHER && (
                  <div className="mb-12 pb-10 border-b border-slate-200 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                          <Award className="text-indigo-600" /> Sinf Rahbari Nazorat Markazi
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Sinfingizdagi o'quvchilarning qadriyatlar dasturi bo'yicha ko'rsatkichlari va ezgu amallari monitoringi.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab('exercises')}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <HeartHandshake size={15} /> Ezgu Ishlarni Tasdiqlash
                        </button>
                        <button
                          onClick={() => setActiveTab('dashboard')}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <LayoutDashboard size={15} /> O'quvchilarni Baholash
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="text-xs text-slate-400 font-semibold">Sinf o'quvchilari</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">{students.length} nafar</p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-semibold">Merosiy tahlillar</p>
                        <p className="text-2xl font-black text-indigo-900 mt-1">{curriculumStats?.heritageSubs || 0} ta</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-semibold">Tasdiqlangan ezgu amallar</p>
                        <p className="text-2xl font-black text-emerald-900 mt-1">{curriculumStats?.deedsVerified || 0} ta</p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-xs text-amber-600 font-semibold">Tasdiq kutilayotganlar</p>
                        <p className="text-2xl font-black text-amber-900 mt-1">{curriculumStats?.deedsPending || 0} ta</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin-only Teacher Credentials Management Section */}
                {role === ROLES.ADMIN && (
                  <div className="mb-12 pb-10 border-b border-slate-200 space-y-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                          <GraduationCap className="text-indigo-600" /> Ustozlar Boshqaruvi va Login/Parol Berish
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Administrator sifatida barcha ustozlarga login va parollarni belgilashingiz yoki yangi o'qituvchi qo'shishingiz mumkin.
                        </p>
                      </div>
                    </div>

                    {/* Teacher List */}
                    <div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Tizimdagi O'qituvchilar</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teachers.map(t => (
                          <div key={t.id} className="p-5 bg-gradient-to-b from-white to-slate-50/80 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-base shadow-md shadow-indigo-100">
                                  {t.name[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{t.name}</p>
                                  <p className="text-xs text-slate-400">{t.email}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => setDeleteConfirm({ id: t.id, type: 'teacher' })}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl opacity-80 hover:opacity-100 transition-all"
                                title="O'chirish"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="text-slate-400 font-semibold">Login:</span>
                                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/60">
                                    {t.username || '—'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="text-slate-400 font-semibold">Parol:</span>
                                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/60">
                                    {t.password || '—'}
                                  </span>
                                </div>
                              </div>

                              <button 
                                onClick={() => setEditingTeacher({ id: t.id, name: t.name, username: t.username || '', password: t.password || '' })}
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                              >
                                <Key size={14} /> Login/Parol Berish
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add New Teacher Form */}
                    <div className="p-6 bg-indigo-50/70 border border-indigo-100 rounded-3xl">
                      <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                        <PlusCircle size={18} className="text-indigo-600" /> Yangi O'qituvchi Qo'shish va Login-Parol Biriktirish
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">Ustozga yangi hisob oching va kirish ma'lumotlarini taqdim eting.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <input 
                          type="text" 
                          placeholder="Ustoz ism sharifi (masalan: Nodir Aliyev)"
                          value={newTeacherName}
                          onChange={(e) => setNewTeacherName(e.target.value)}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <input 
                          type="email" 
                          placeholder="Email manzili"
                          value={newTeacherEmail}
                          onChange={(e) => setNewTeacherEmail(e.target.value)}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <input 
                          type="text" 
                          placeholder="Login (masalan: Ustoz2)"
                          value={newTeacherUsername}
                          onChange={(e) => setNewTeacherUsername(e.target.value)}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <input 
                          type="text" 
                          placeholder="Parol (masalan: Ustoz2025!)"
                          value={newTeacherPassword}
                          onChange={(e) => setNewTeacherPassword(e.target.value)}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <button 
                        onClick={handleAddTeacher}
                        className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 text-sm flex items-center justify-center gap-2"
                      >
                        <PlusCircle size={16} /> O'qituvchini Saqlash va Login-Parolni Berish
                      </button>
                    </div>
                  </div>
                )}

                {/* Students Credentials Management Section for Teacher and Admin */}
                {(role === ROLES.TEACHER || role === ROLES.ADMIN) && (
                  <div className="mb-12 pb-10 border-b border-slate-200 space-y-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                          <Key className="text-amber-500" /> O'quvchilar Boshqaruvi va Login/Parol Berish
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Admin va o'qituvchilar o'quvchilarga platformadan foydalanishi va mashqlarni bajarishi uchun login va parollarni boshqarishlari mumkin.
                        </p>
                      </div>
                      <span className="text-xs font-bold bg-amber-50 text-amber-700 px-3.5 py-1.5 rounded-full border border-amber-200/80">
                        Jami: {students.length} o'quvchi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {students.map(s => (
                        <div key={s.id} className="p-5 bg-gradient-to-b from-white to-slate-50/80 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-200 transition-all group">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-bold text-base shadow-md shadow-amber-100">
                                {s.name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{s.name}</p>
                                <p className="text-xs text-slate-400">Ota-ona: {s.parent_name || "Biriktirilmagan"}</p>
                                <p className="text-xs text-slate-400">Ustoz: {s.teacher_name || "Biriktirilmagan"}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setDeleteConfirm({ id: s.id, type: 'student' })}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl opacity-80 hover:opacity-100 transition-all"
                              title="O'chirish"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-slate-400 font-semibold">Login:</span>
                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/60">
                                  {s.username || '—'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-slate-400 font-semibold">Parol:</span>
                                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/60">
                                  {s.password || '—'}
                                </span>
                              </div>
                            </div>

                            <button 
                              onClick={() => setEditingStudentCredentials({ id: s.id, name: s.name, username: s.username || '', password: s.password || '' })}
                              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              <Key size={14} /> Login/Parol Berish
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parents Section for Teachers and Admin */}
                {(role === ROLES.TEACHER || role === ROLES.ADMIN) && (
                  <>
                    <h3 className="text-2xl font-bold mb-8">Tizim Foydalanuvchilari (Ota-onalar)</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Ota-onalar ro'yxati</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {parents.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold shadow-sm">
                                  {p.name[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{p.name}</p>
                                  <p className="text-xs text-slate-400">{p.email}</p>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">L: {p.username}</span>
                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">P: {p.password}</span>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => setDeleteConfirm({ id: p.id, type: 'parent' })}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl opacity-100 sm:opacity-40 group-hover:opacity-100 transition-all"
                                title="O'chirish"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-100">
                        <h4 className="font-bold text-lg mb-4">Yangi Ota-ona qo'shish</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <input 
                            type="text" 
                            placeholder="Ism sharifi"
                            value={newParentName}
                            onChange={(e) => setNewParentName(e.target.value)}
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <input 
                            type="email" 
                            placeholder="Email manzili"
                            value={newParentEmail}
                            onChange={(e) => setNewParentEmail(e.target.value)}
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <input 
                            type="text" 
                            placeholder="Login"
                            value={newParentUsername}
                            onChange={(e) => setNewParentUsername(e.target.value)}
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <input 
                            type="password" 
                            placeholder="Parol"
                            value={newParentPassword}
                            onChange={(e) => setNewParentPassword(e.target.value)}
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <button 
                          onClick={handleAddParent}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                        >
                          Ota-onani qo'shish
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
