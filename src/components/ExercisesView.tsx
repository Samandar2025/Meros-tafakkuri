import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  PlusCircle, 
  ChevronRight, 
  ChevronLeft,
  Check, 
  X, 
  ArrowLeft, 
  Compass, 
  HeartHandshake, 
  ScrollText, 
  Send, 
  Eye, 
  ThumbsUp,
  Tag,
  ListOrdered,
  HelpCircle,
  Edit3,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeritageMaterial, 
  HeritageSubmission, 
  MoralSituation, 
  MoralChoiceSubmission, 
  GoodDeedTask, 
  GoodDeedRecord, 
  User 
} from '../types';

interface ExercisesViewProps {
  currentUser: User | any;
  role: string;
  studentId?: number;
  exercises?: any[];
  submissions?: any[];
  onRefreshData?: () => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export const ExercisesView: React.FC<ExercisesViewProps> = ({
  currentUser,
  role,
  studentId,
  onRefreshData,
  onShowToast
}) => {
  // Primary Module Navigation
  const [activeModule, setActiveModule] = useState<'heritage' | 'moral_choice' | 'good_deeds' | 'monitoring'>('heritage');

  // Loading and refreshing states
  const [loading, setLoading] = useState(false);

  // 1. Meros izidan state
  const [heritageMaterials, setHeritageMaterials] = useState<HeritageMaterial[]>([]);
  const [heritageSubmissions, setHeritageSubmissions] = useState<HeritageSubmission[]>([]);
  const [activeHeritageMaterial, setActiveHeritageMaterial] = useState<HeritageMaterial | null>(null);
  
  // Sequential Questions State (Savollar ketma-ketlikda berilishi)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [sequentialAnswers, setSequentialAnswers] = useState<{ [index: number]: string }>({});
  const [submittingHeritage, setSubmittingHeritage] = useState(false);

  // 2. Men qanday yo'l tutaman state
  const [moralSituations, setMoralSituations] = useState<MoralSituation[]>([]);
  const [moralChoices, setMoralChoices] = useState<MoralChoiceSubmission[]>([]);
  const [activeSituation, setActiveSituation] = useState<MoralSituation | null>(null);
  const [situationStep, setSituationStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [selectedOptionText, setSelectedOptionText] = useState<string>('');
  const [choiceReason, setChoiceReason] = useState<string>('');
  const [choiceConsequence, setChoiceConsequence] = useState<string>('');
  const [submittingMoralChoice, setSubmittingMoralChoice] = useState(false);

  // 3. Ezgu ishlarim state
  const [goodDeedTasks, setGoodDeedTasks] = useState<GoodDeedTask[]>([]);
  const [goodDeedRecords, setGoodDeedRecords] = useState<GoodDeedRecord[]>([]);
  const [showDeedModal, setShowDeedModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [deedWhatDone, setDeedWhatDone] = useState('');
  const [deedWithWhom, setDeedWithWhom] = useState('');
  const [deedResultImpact, setDeedResultImpact] = useState('');
  const [submittingDeed, setSubmittingDeed] = useState(false);

  // "Bugungi ezgu ishim" Hero State
  const [todayTaskStarted, setTodayTaskStarted] = useState(false);
  const [activeHeroTask, setActiveHeroTask] = useState<GoodDeedTask | null>(null);
  const [selectedBankValue, setSelectedBankValue] = useState<string>('all');
  const [selectedCycleValue, setSelectedCycleValue] = useState<string>('Mehr-oqibat');

  // Teacher feedback modal / state
  const [verifyingDeedId, setVerifyingDeedId] = useState<number | null>(null);
  const [teacherFeedbackText, setTeacherFeedbackText] = useState('');

  // Creation modal for teachers / admin
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCategory, setCreateCategory] = useState<'heritage' | 'situation' | 'task'>('heritage');
  // New Heritage Material
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatType, setNewMatType] = useState('rivoyat');
  const [newMatContent, setNewMatContent] = useState('');
  const [newMatConnection, setNewMatConnection] = useState('');
  const [newMatValues, setNewMatValues] = useState('');
  const [newMatQuestions, setNewMatQuestions] = useState<string[]>(['', '', '', '', '', '']);
  // New Situation
  const [newSitTitle, setNewSitTitle] = useState('');
  const [newSitCategory, setNewSitCategory] = useState('Halollik va Omonatdorlik');
  const [newSitValuesDirection, setNewSitValuesDirection] = useState('');
  const [newSitText, setNewSitText] = useState('');
  const [newSitReasonPrompt, setNewSitReasonPrompt] = useState('Nima uchun aynan shu yo‘lni tanladingiz?');
  const [newSitConsequencePrompt, setNewSitConsequencePrompt] = useState('Sizningcha, bu qarorning oqibati qanday bo‘ladi?');
  const [newSitOptions, setNewSitOptions] = useState<string[]>(['', '', '', '']);
  // New Deed Task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Ko\'mak va Saxovat');

  const effectiveStudentId = role === 'student' ? (currentUser?.studentId || currentUser?.id || studentId) : studentId;

  // Fetch all module data
  const loadModuleData = async () => {
    setLoading(true);
    try {
      const [
        matRes, 
        matSubsRes, 
        sitRes, 
        choicesRes, 
        tasksRes, 
        deedsRes
      ] = await Promise.all([
        fetch('/api/heritage-materials'),
        fetch(role === 'student' && effectiveStudentId ? `/api/heritage-submissions/${effectiveStudentId}` : '/api/heritage-submissions'),
        fetch('/api/moral-situations'),
        fetch(role === 'student' && effectiveStudentId ? `/api/moral-choices/${effectiveStudentId}` : '/api/moral-choices'),
        fetch('/api/good-deeds/tasks'),
        fetch(role === 'student' && effectiveStudentId ? `/api/good-deeds/records/${effectiveStudentId}` : '/api/good-deeds/records')
      ]);

      if (matRes.ok) setHeritageMaterials(await matRes.json());
      if (matSubsRes.ok) setHeritageSubmissions(await matSubsRes.json());
      if (sitRes.ok) setMoralSituations(await sitRes.json());
      if (choicesRes.ok) setMoralChoices(await choicesRes.json());
      if (tasksRes.ok) {
        const loadedTasks: GoodDeedTask[] = await tasksRes.json();
        setGoodDeedTasks(loadedTasks);
        setActiveHeroTask(prev => prev || loadedTasks.find(t => t.value_name === 'Mehnatsevarlik' || t.value_name === 'Mehr-oqibat') || loadedTasks[0] || null);
      }
      if (deedsRes.ok) setGoodDeedRecords(await deedsRes.json());
    } catch (err) {
      console.error('Error fetching values modules data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModuleData();
  }, [role, effectiveStudentId]);

  // Open a heritage material for sequential analysis
  const openHeritageMaterial = (mat: HeritageMaterial) => {
    setActiveHeritageMaterial(mat);
    setActiveQuestionIndex(0);

    // Pre-populate if student already has submissions for this material
    const existing = heritageSubmissions.find(s => s.material_id === mat.id);
    if (existing && Array.isArray(existing.answers)) {
      const answersMap: { [idx: number]: string } = {};
      existing.answers.forEach((item: any, i: number) => {
        answersMap[i] = item.answer || '';
      });
      setSequentialAnswers(answersMap);
    } else {
      setSequentialAnswers({});
    }
  };

  // 1. Sequential Heritage Questions Submit
  const handleHeritageSubmit = async () => {
    if (!activeHeritageMaterial || !effectiveStudentId) {
      onShowToast("Iltimos, o'quvchi profilini aniqlang", 'error');
      return;
    }

    const questions = activeHeritageMaterial.questions || [];
    const formattedAnswers = questions.map((q, idx) => ({
      questionNumber: idx + 1,
      question: q,
      answer: (sequentialAnswers[idx] || '').trim()
    }));

    // Validate that all questions are answered in sequence
    const unansweredIndex = formattedAnswers.findIndex(a => !a.answer);
    if (unansweredIndex !== -1) {
      onShowToast(`Iltimos, ${unansweredIndex + 1}-savolga javob yozing`, 'error');
      setActiveQuestionIndex(unansweredIndex);
      return;
    }

    setSubmittingHeritage(true);
    try {
      const res = await fetch('/api/heritage-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: effectiveStudentId,
          material_id: activeHeritageMaterial.id,
          answers: formattedAnswers
        })
      });

      if (res.ok) {
        onShowToast("Meros namunasi qadriyatlar tahlili muvaffaqiyatli saqlandi!", 'success');
        setActiveHeritageMaterial(null);
        setActiveQuestionIndex(0);
        setSequentialAnswers({});
        await loadModuleData();
        if (onRefreshData) await onRefreshData();
      } else {
        onShowToast("Saqlashda xatolik yuz berdi", 'error');
      }
    } catch (err) {
      onShowToast("Tarmoq xatosi", 'error');
    } finally {
      setSubmittingHeritage(false);
    }
  };

  // 2. Moral Choice Submit (Chain: Vaziyat -> Variant -> Tanlov -> Sabab -> Oqibat)
  const handleMoralChoiceSubmit = async () => {
    if (!activeSituation || !effectiveStudentId || selectedOptionId === null) {
      onShowToast("Iltimos, vaziyat va variantni tanlang", 'error');
      return;
    }
    if (!choiceReason.trim() || !choiceConsequence.trim()) {
      onShowToast("Iltimos, tanlov sababi va ehtimoliy oqibatni yozing", 'error');
      return;
    }

    setSubmittingMoralChoice(true);
    try {
      const res = await fetch('/api/moral-choices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: effectiveStudentId,
          situation_id: activeSituation.id,
          selected_option_id: selectedOptionId,
          selected_option_text: selectedOptionText,
          reason: choiceReason,
          expected_consequence: choiceConsequence
        })
      });

      if (res.ok) {
        onShowToast("Ma'naviy tanlov zanjiringiz muvaffaqiyatli qayd etildi!", 'success');
        setActiveSituation(null);
        setSituationStep(1);
        setSelectedOptionId(null);
        setSelectedOptionText('');
        setChoiceReason('');
        setChoiceConsequence('');
        await loadModuleData();
        if (onRefreshData) await onRefreshData();
      } else {
        onShowToast("Tanlovni saqlashda xatolik yuz berdi", 'error');
      }
    } catch (err) {
      onShowToast("Tarmoq xatosi", 'error');
    } finally {
      setSubmittingMoralChoice(false);
    }
  };

  // 3. Good Deed Submit
  const handleGoodDeedSubmit = async (e?: React.FormEvent, customTaskId?: number | null) => {
    if (e) e.preventDefault();
    if (!effectiveStudentId) {
      onShowToast("O'quvchi profili topilmadi", 'error');
      return;
    }
    if (!deedWhatDone.trim() || !deedWithWhom.trim() || !deedResultImpact.trim()) {
      onShowToast("Iltimos, barcha 3 ta qatorni to'ldiring: Nima qildim, Kim bilan/uchun, Qanday natija bo‘ldi", 'error');
      return;
    }

    setSubmittingDeed(true);
    try {
      const taskIdToUse = customTaskId !== undefined ? customTaskId : (selectedTaskId || activeHeroTask?.id || null);
      const res = await fetch('/api/good-deeds/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: effectiveStudentId,
          task_id: taskIdToUse,
          what_done: deedWhatDone,
          with_whom: deedWithWhom,
          result_impact: deedResultImpact,
          status: 'submitted'
        })
      });

      if (res.ok) {
        onShowToast("Ezgu ishingiz muvaffaqiyatli yakunlandi va qayd etildi! Barakalla!", 'success');
        setShowDeedModal(false);
        setTodayTaskStarted(false);
        setDeedWhatDone('');
        setDeedWithWhom('');
        setDeedResultImpact('');
        setSelectedTaskId(null);
        await loadModuleData();
        if (onRefreshData) await onRefreshData();
      } else {
        onShowToast("Ezgu amalni saqlashda xatolik", 'error');
      }
    } catch (err) {
      onShowToast("Tarmoq xatosi", 'error');
    } finally {
      setSubmittingDeed(false);
    }
  };

  // Teacher verify good deed (3 holat: Qayd etildi -> Ko‘rib chiqildi -> Qayta aloqa berildi)
  const handleVerifyDeed = async (recordId: number, feedbackOverride?: string, statusOverride?: 'reviewed' | 'feedback_given') => {
    try {
      const feedback = feedbackOverride !== undefined ? feedbackOverride : teacherFeedbackText;
      const status = statusOverride || (feedback?.trim() ? 'feedback_given' : 'reviewed');
      const res = await fetch(`/api/good-deeds/verify/${recordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_feedback: feedback || "Pedagog tomonidan ko‘rib chiqildi.",
          status: status
        })
      });
      if (res.ok) {
        onShowToast(status === 'feedback_given' ? "Qayta aloqa muvaffaqiyatli saqlandi!" : "Ezgu amal ko'rib chiqildi deb belgilandi!", 'success');
        setVerifyingDeedId(null);
        setTeacherFeedbackText('');
        await loadModuleData();
      }
    } catch (err) {
      onShowToast("Xatolik yuz berdi", 'error');
    }
  };

  // Teacher / Admin create new content
  const handleCreateNewContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (createCategory === 'heritage') {
        if (!newMatTitle || !newMatContent) return;
        const validQuestions = newMatQuestions.filter(q => q.trim().length > 0);
        const res = await fetch('/api/heritage-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newMatTitle,
            type: newMatType,
            content: newMatContent,
            connection: newMatConnection,
            values_direction: newMatValues,
            questions: validQuestions,
            author_or_source: 'Rivoyat'
          })
        });
        if (res.ok) {
          onShowToast("Yangi meros namunasi qo'shildi!", 'success');
          setShowCreateModal(false);
          setNewMatTitle('');
          setNewMatContent('');
          setNewMatConnection('');
          setNewMatValues('');
          setNewMatQuestions(['', '', '', '', '', '']);
          await loadModuleData();
        }
      } else if (createCategory === 'situation') {
        if (!newSitTitle || !newSitText) return;
        const validOptions = newSitOptions.filter(o => o.trim().length > 0).map((opt, idx) => ({ id: idx + 1, text: opt }));
        if (validOptions.length < 2) {
          onShowToast("Kamida 2 ta muqobil variant kiriting", 'error');
          return;
        }
        const res = await fetch('/api/moral-situations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newSitTitle,
            category: newSitCategory,
            values_direction: newSitValuesDirection,
            situation_text: newSitText,
            options: validOptions,
            reason_prompt: newSitReasonPrompt,
            consequence_prompt: newSitConsequencePrompt
          })
        });
        if (res.ok) {
          onShowToast("Yangi ma'naviy tanlov vaziyati qo'shildi!", 'success');
          setShowCreateModal(false);
          setNewSitTitle('');
          setNewSitCategory('Halollik va Omonatdorlik');
          setNewSitValuesDirection('');
          setNewSitText('');
          setNewSitReasonPrompt('Nima uchun aynan shu yo‘lni tanladingiz?');
          setNewSitConsequencePrompt('Sizningcha, bu qarorning oqibati qanday bo‘ladi?');
          setNewSitOptions(['', '', '', '']);
          await loadModuleData();
        }
      } else if (createCategory === 'task') {
        if (!newTaskTitle || !newTaskDesc) return;
        const res = await fetch('/api/good-deeds/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTaskTitle,
            description: newTaskDesc,
            category: newTaskCategory
          })
        });
        if (res.ok) {
          onShowToast("Yangi ezgu ish topshirig'i qo'shildi!", 'success');
          setShowCreateModal(false);
          setNewTaskTitle('');
          setNewTaskDesc('');
          await loadModuleData();
        }
      }
    } catch (err) {
      onShowToast("Xatolik yuz berdi", 'error');
    }
  };

  // Check if student completed a material
  const isMaterialCompleted = (materialId: number) => {
    return heritageSubmissions.some(s => s.material_id === materialId);
  };

  // Check if student completed a situation
  const isSituationCompleted = (situationId: number) => {
    return moralChoices.some(c => c.situation_id === situationId);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner & Module Selector */}
      <div className="bg-gradient-to-br from-indigo-950/95 via-indigo-900/90 to-slate-900/95 rounded-3xl sm:rounded-[36px] p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <img 
          src="/meros_heritage_bg.jpg" 
          alt="Meros Tafakkur National Heritage Background" 
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity pointer-events-none" 
        />
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-indigo-200 text-xs font-semibold mb-3 border border-white/10">
              <Sparkles size={14} className="text-amber-300" />
              <span>Meros Tafakkur • Qadriyatlar Modullari</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Meros va Qadriyatlar Ekotizimi
            </h2>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Milliy ma’naviy meros namunalari, mustaqil ma’naviy tanlov hamda amaliy ezgu amallar orqali qadriyatlarni hayotda qo'llash.
            </p>
          </div>

          {/* Action buttons for Teacher / Admin */}
          {(role === 'teacher' || role === 'admin') && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-95"
              >
                <PlusCircle size={17} /> Yangi Qo‘shish
              </button>
            </div>
          )}
        </div>

        {/* 3 Main Pedagogical Module Tabs + Monitoring for Staff */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => {
              setActiveModule('heritage');
              setActiveHeritageMaterial(null);
            }}
            className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all cursor-pointer text-left ${
              activeModule === 'heritage'
                ? 'bg-white text-indigo-900 shadow-md font-bold'
                : 'bg-white/5 hover:bg-white/10 text-indigo-100 font-medium'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              activeModule === 'heritage' ? 'bg-indigo-100 text-indigo-700' : 'bg-white/10 text-white'
            }`}>
              <ScrollText size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">1. Meros izidan</p>
              <p className="text-[11px] opacity-75 line-clamp-1">Qadriyatlar tahlili (6 savol)</p>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveModule('moral_choice');
              setActiveSituation(null);
              setSituationStep(1);
            }}
            className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all cursor-pointer text-left ${
              activeModule === 'moral_choice'
                ? 'bg-white text-indigo-900 shadow-md font-bold'
                : 'bg-white/5 hover:bg-white/10 text-indigo-100 font-medium'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              activeModule === 'moral_choice' ? 'bg-indigo-100 text-indigo-700' : 'bg-white/10 text-white'
            }`}>
              <Compass size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">2. Men qanday yo‘l tutaman?</p>
              <p className="text-[11px] opacity-75 line-clamp-1">Ma'naviy tanlov zanjiri</p>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveModule('good_deeds');
              setShowDeedModal(false);
            }}
            className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all cursor-pointer text-left ${
              activeModule === 'good_deeds'
                ? 'bg-white text-indigo-900 shadow-md font-bold'
                : 'bg-white/5 hover:bg-white/10 text-indigo-100 font-medium'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              activeModule === 'good_deeds' ? 'bg-indigo-100 text-indigo-700' : 'bg-white/10 text-white'
            }`}>
              <HeartHandshake size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">3. Ezgu ishlarim</p>
              <p className="text-[11px] opacity-75 line-clamp-1">Merosdan hayotga</p>
            </div>
          </button>

          {(role === 'teacher' || role === 'admin' || role === 'psychologist' || role === 'parent') && (
            <button
              onClick={() => setActiveModule('monitoring')}
              className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all cursor-pointer text-left ${
                activeModule === 'monitoring'
                  ? 'bg-white text-indigo-900 shadow-md font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-indigo-100 font-medium'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activeModule === 'monitoring' ? 'bg-indigo-100 text-indigo-700' : 'bg-white/10 text-white'
              }`}>
                <Eye size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Monitoring & Tahlil</p>
                <p className="text-[11px] opacity-75 line-clamp-1">O'quvchilar natijalari</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODUL 1: "MEROS IZIDAN" (Savollar ketma-ketlikda beriladi) */}
      {/* ========================================================================= */}
      {activeModule === 'heritage' && (
        <div className="space-y-6">
          {!activeHeritageMaterial ? (
            <>
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    “Meros izidan” Moduli
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pedagogik vazifasi: milliy ma’naviy meros namunasidagi qadriyatli mazmunni anglash va tahlil qilish.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                  {heritageMaterials.length} ta meros namunasi
                </span>
              </div>

              {/* Grid of 5 Heritage Materials */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {heritageMaterials.map((mat, index) => {
                  const completed = isMaterialCompleted(mat.id);

                  return (
                    <motion.div
                      key={mat.id}
                      whileHover={{ y: -3 }}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            {index + 1}-meros namunasi
                          </span>
                          {completed ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                              <CheckCircle2 size={13} /> Tahlil qilingan
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                              Yangi vazifa
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {mat.title}
                          </h3>
                          {mat.values_direction && (
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <Tag size={12} className="text-indigo-500" />
                              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded-md">
                                {mat.values_direction}
                              </span>
                            </div>
                          )}
                        </div>

                        {mat.connection && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-snug">
                            <span className="font-bold text-slate-700">Mazmuniy bog'lanish: </span>
                            {mat.connection}
                          </div>
                        )}

                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed italic bg-amber-50/30 p-3 rounded-2xl border border-amber-100/60 font-serif">
                          "{mat.content.substring(0, 160)}..."
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                          <ListOrdered size={14} className="text-indigo-500" />
                          <span>{mat.questions?.length || 6} ta ketma-ket savol</span>
                        </div>
                        <button
                          onClick={() => openHeritageMaterial(mat)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            completed 
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100'
                          }`}
                        >
                          <span>{completed ? 'Qayta ko‘rish' : 'O‘qish va Tahlil'}</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Active Heritage Material Sequential Reader & Analysis Task */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              {/* Top return button */}
              <button
                onClick={() => setActiveHeritageMaterial(null)}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs active:scale-95"
              >
                <ArrowLeft size={16} /> Barcha meros namunalariga qaytish
              </button>

              {/* Full Story Reader Card */}
              <div className="bg-white rounded-3xl sm:rounded-[36px] p-6 sm:p-10 border border-slate-200 shadow-sm relative overflow-hidden space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Rivoyat
                  </span>
                  {activeHeritageMaterial.values_direction && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Qadriyat: {activeHeritageMaterial.values_direction}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {activeHeritageMaterial.title}
                </h2>

                {activeHeritageMaterial.connection && (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600">
                    <span className="font-bold text-slate-800">Mazmuniy bog‘lanish: </span>
                    {activeHeritageMaterial.connection}
                  </div>
                )}

                {/* Story text */}
                <div className="bg-gradient-to-br from-amber-50/40 via-white to-indigo-50/20 p-5 sm:p-8 rounded-3xl border border-amber-100 text-slate-800 text-sm sm:text-base leading-relaxed font-serif relative">
                  <span className="text-4xl text-amber-300/80 font-serif absolute top-2 left-3 select-none">“</span>
                  <div className="relative z-10 pl-4 space-y-3 whitespace-pre-line">
                    {activeHeritageMaterial.content}
                  </div>
                  <span className="text-4xl text-amber-300/80 font-serif absolute bottom-0 right-3 select-none">”</span>
                </div>
              </div>

              {/* “Qadriyatlar tahlili” — Sequential Flow (Savollar ketma-ketlikda) */}
              <div className="bg-white rounded-3xl sm:rounded-[36px] p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
                {/* Header */}
                <div className="border-b border-slate-100 pb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full mb-2">
                    <ListOrdered size={14} /> “Qadriyatlar tahlili” topshiriqlari
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Savollarga ketma-ketlikda javob bering
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Platforma faqat matnni o‘qitib test bermaydi. O‘quvchi qadriyatni bosqichma-bosqich chuqur tahlil qiladi.
                  </p>
                </div>

                {/* Sequential Step Selector Tabs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="text-indigo-600">
                      {activeQuestionIndex < (activeHeritageMaterial.questions?.length || 6) 
                        ? `${activeQuestionIndex + 1}-savol (Jami: ${activeHeritageMaterial.questions?.length || 6} ta)`
                        : "Xulosa va Tekshirish"}
                    </span>
                    <span>
                      {Math.round(((Object.values(sequentialAnswers).filter(Boolean).length) / (activeHeritageMaterial.questions?.length || 6)) * 100)}% bajarildi
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${((Object.values(sequentialAnswers).filter(Boolean).length) / (activeHeritageMaterial.questions?.length || 6)) * 100}%` 
                      }}
                    />
                  </div>

                  {/* Number buttons for jump navigation */}
                  <div className="flex items-center gap-2 overflow-x-auto py-2">
                    {(activeHeritageMaterial.questions || []).map((_, qIdx) => {
                      const isCurrent = activeQuestionIndex === qIdx;
                      const hasAnswer = Boolean((sequentialAnswers[qIdx] || '').trim());

                      return (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => setActiveQuestionIndex(qIdx)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                              : hasAnswer
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {hasAnswer && <Check size={12} className={isCurrent ? 'text-white' : 'text-emerald-600'} />}
                          <span>{qIdx + 1}-savol</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setActiveQuestionIndex(activeHeritageMaterial.questions?.length || 6)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeQuestionIndex === (activeHeritageMaterial.questions?.length || 6)
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Xulosa
                    </button>
                  </div>
                </div>

                {/* CURRENT ACTIVE QUESTION SCREEN (Ketma-ket savol kartochkasi) */}
                {activeQuestionIndex < (activeHeritageMaterial.questions?.length || 6) ? (
                  <motion.div
                    key={activeQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-5 sm:p-8 bg-slate-50/70 border border-slate-200 rounded-3xl space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-sm">
                        {activeQuestionIndex + 1}
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          Ketma-ket savol • {activeQuestionIndex + 1} / {activeHeritageMaterial.questions?.length || 6}
                        </span>
                        <h4 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                          {activeHeritageMaterial.questions[activeQuestionIndex]}
                        </h4>
                      </div>
                    </div>

                    <div className="pt-2">
                      <textarea
                        rows={4}
                        value={sequentialAnswers[activeQuestionIndex] || ''}
                        onChange={(e) => {
                          setSequentialAnswers({
                            ...sequentialAnswers,
                            [activeQuestionIndex]: e.target.value
                          });
                        }}
                        placeholder={`Ushbu savol bo'yicha mustaqil tahliliy fikringizni yozing...`}
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                        autoFocus
                      />
                    </div>

                    {/* Question navigation buttons */}
                    <div className="flex items-center justify-between pt-3">
                      <button
                        type="button"
                        disabled={activeQuestionIndex === 0}
                        onClick={() => setActiveQuestionIndex(prev => prev - 1)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} /> Oldingi savol
                      </button>

                      {activeQuestionIndex < (activeHeritageMaterial.questions?.length || 6) - 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!sequentialAnswers[activeQuestionIndex]?.trim()) {
                              onShowToast("Iltimos, avval ushbu savolga javob yozing", 'error');
                              return;
                            }
                            setActiveQuestionIndex(prev => prev + 1);
                          }}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span>Keyingi savol ({activeQuestionIndex + 2})</span>
                          <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!sequentialAnswers[activeQuestionIndex]?.trim()) {
                              onShowToast("Iltimos, avval ushbu savolga javob yozing", 'error');
                              return;
                            }
                            setActiveQuestionIndex(activeHeritageMaterial.questions?.length || 6);
                          }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span>Barcha javoblarni ko‘rish va tasdiqlash</span>
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  /* REVIEW & FINAL SUBMISSION SCREEN (Barcha 6 ta savol xulosasi) */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl">
                      <p className="text-xs font-bold text-indigo-900">
                        Barcha 6 ta savolga berilgan javoblaringiz ketma-ketlikda jamlandi:
                      </p>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        Javoblaringizni tekshiring yoki o'zgartirish uchun qalam belgisini bosing.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {(activeHeritageMaterial.questions || []).map((q, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800">
                              {idx + 1}. {q}
                            </p>
                            <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-100 font-medium">
                              {sequentialAnswers[idx] || <span className="text-rose-500 italic">Javob yozilmagan</span>}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveQuestionIndex(idx)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer shrink-0"
                            title="Tahrirlash"
                          >
                            <Edit3 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setActiveQuestionIndex((activeHeritageMaterial.questions?.length || 6) - 1)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                      >
                        <ChevronLeft size={16} /> Savollarga qaytish
                      </button>
                      <button
                        type="button"
                        disabled={submittingHeritage}
                        onClick={handleHeritageSubmit}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-200 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 active:scale-95"
                      >
                        {submittingHeritage ? <span className="animate-spin">⏳</span> : <Check size={16} />}
                        <span>Tahlilni saqlash va topshirish</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODUL 2: "MEN QANDAY YO'L TUTAMAN?" (Ma'naviy Tanlov) */}
      {/* ========================================================================= */}
      {activeModule === 'moral_choice' && (
        <div className="space-y-6">
          {!activeSituation ? (
            <>
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Qadriyatli-muammoli Hayotiy Vaziyatlar</h3>
                  <p className="text-xs text-slate-500">
                    Vaziyatni o'rganing, o'z yo'lingizni tanlang, sababini va kutilayotgan oqibatini tahlil qiling.
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  Jami: {moralSituations.length} ta vaziyat
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {moralSituations.map((sit) => {
                  const completed = isSituationCompleted(sit.id);

                  return (
                    <motion.div
                      key={sit.id}
                      whileHover={{ y: -3 }}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {sit.category}
                            </span>
                            {sit.values_direction && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {sit.values_direction}
                              </span>
                            )}
                          </div>
                          {completed ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                              <CheckCircle2 size={13} /> Tanlov qilingan
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                              Yechim kutmoqda
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {sit.title}
                        </h3>

                        <p className="text-xs text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                          {sit.situation_text}
                        </p>

                        <div className="mt-4">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Mavjud muqobil variantlar:
                          </p>
                          <ul className="space-y-1.5">
                            {sit.options.map((opt, i) => (
                              <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="line-clamp-1">{opt.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Compass size={14} /> Ma'naviy zanjir
                        </span>
                        <button
                          onClick={() => {
                            setActiveSituation(sit);
                            setSituationStep(1);
                            setSelectedOptionId(null);
                            setSelectedOptionText('');
                            setChoiceReason('');
                            setChoiceConsequence('');
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            completed
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100'
                          }`}
                        >
                          <span>{completed ? 'Qayta ko‘rish / Yangilash' : 'Qaror qabul qilish'}</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Multi-step Interactive "Ma'naviy Tanlov" Flow */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <button
                onClick={() => setActiveSituation(null)}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs"
              >
                <ArrowLeft size={16} /> Barcha vaziyatlarga qaytish
              </button>

              {/* Progress Indicator */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-indigo-600">Qadam {situationStep} / 4</span>
                  <span className="text-slate-500">
                    {situationStep === 1 && "Vaziyat va Variantni tanlash"}
                    {situationStep === 2 && "Tanlov sababini tushuntirish"}
                    {situationStep === 3 && "Ehtimoliy oqibatni bashorat qilish"}
                    {situationStep === 4 && "Ma'naviy zanjirni tasdiqlash"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(situationStep / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step 1: Scenario & Choice selection */}
              {situationStep === 1 && (
                <div className="bg-white rounded-3xl sm:rounded-[32px] p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {activeSituation.category}
                      </span>
                      {activeSituation.values_direction && (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Qadriyatli yo‘nalish: {activeSituation.values_direction}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                      {activeSituation.title}
                    </h3>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-800 text-sm sm:text-base mt-4 leading-relaxed font-medium">
                      {activeSituation.situation_text}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-3">
                      Siz qanday yo‘l tutasiz? (Variantlardan birini tanlang):
                    </h4>
                    <div className="space-y-3">
                      {activeSituation.options.map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => {
                            setSelectedOptionId(opt.id);
                            setSelectedOptionText(opt.text);
                          }}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                            selectedOptionId === opt.id
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                              : 'border-slate-100 hover:border-slate-200 bg-white'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            selectedOptionId === opt.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                          }`}>
                            {selectedOptionId === opt.id && <Check size={12} />}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-slate-800">
                            {opt.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      disabled={selectedOptionId === null}
                      onClick={() => setSituationStep(2)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-200 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
                    >
                      <span>Keyingi qadam: Tanlovimni asoslayman</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Reason for selection (Tanlovimni asoslayman) */}
              {situationStep === 2 && (
                <div className="bg-white rounded-3xl sm:rounded-[32px] p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Siz tanlagan yo'l:</span>
                    <p className="text-sm font-bold text-indigo-700 bg-indigo-50 p-3 rounded-xl border border-indigo-100 mt-1">
                      "{selectedOptionText}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="inline-block">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Tanlovimni asoslayman
                      </span>
                    </div>
                    <label className="block text-base sm:text-lg font-bold text-slate-900 mt-2">
                      {activeSituation.reason_prompt || "Nima uchun aynan shu yo‘lni tanladingiz?"}
                    </label>
                    <p className="text-xs text-slate-500">
                      Bu qarorga kelishingizga qaysi insoniy tuyg'u, qadriyat yoki sabab turtki bo'ldi? Fikringizni erkin bayon qiling.
                    </p>
                    <textarea
                      rows={4}
                      value={choiceReason}
                      onChange={(e) => setChoiceReason(e.target.value)}
                      placeholder="Men bu yo'lni tanladim, chunki..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      required
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <button
                      onClick={() => setSituationStep(1)}
                      className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Ortga
                    </button>
                    <button
                      disabled={!choiceReason.trim()}
                      onClick={() => setSituationStep(3)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-200 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
                    >
                      <span>Keyingi qadam: Oqibatini o‘ylayman</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Expected Consequence (Oqibatini o‘ylayman) */}
              {situationStep === 3 && (
                <div className="bg-white rounded-3xl sm:rounded-[32px] p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Siz tanlagan yo'l:</span>
                    <p className="text-sm font-bold text-indigo-700 bg-indigo-50 p-3 rounded-xl border border-indigo-100 mt-1">
                      "{selectedOptionText}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="inline-block">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Oqibatini o‘ylayman
                      </span>
                    </div>
                    <label className="block text-base sm:text-lg font-bold text-slate-900 mt-2">
                      {activeSituation.consequence_prompt || "Sizningcha, bu qarorning oqibati qanday bo‘ladi?"}
                    </label>
                    <p className="text-xs text-slate-500">
                      Sizning harakatingizdan keyin o'zingizda, sinfda yoki boshqalarda qanday natija yuzaga keladi?
                    </p>
                    <textarea
                      rows={4}
                      value={choiceConsequence}
                      onChange={(e) => setChoiceConsequence(e.target.value)}
                      placeholder="Bu qaror tufayli ehtimoliy oqibat shunday bo'ladiki..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      required
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <button
                      onClick={() => setSituationStep(2)}
                      className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Ortga
                    </button>
                    <button
                      disabled={!choiceConsequence.trim()}
                      onClick={() => setSituationStep(4)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-200 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
                    >
                      <span>Zanjirni ko'rish</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Chain Summary & Final Submission */}
              {situationStep === 4 && (
                <div className="bg-white rounded-3xl sm:rounded-[32px] p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
                  <div className="text-center pb-2">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <Compass size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      "Ma'naviy Tanlov" Zanjiri
                    </h3>
                    <p className="text-xs text-slate-500">
                      Qaroringiz to'liq zanjir sifatida tizimga muhrlanadi.
                    </p>
                  </div>

                  {/* Chain Visual Cards */}
                  <div className="space-y-3 relative">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Hayotiy vaziyat</p>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-1">{activeSituation.situation_text}</p>
                    </div>

                    <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">2. Sizning tanlovingiz</p>
                      <p className="text-xs sm:text-sm font-bold text-indigo-900 mt-1">{selectedOptionText}</p>
                    </div>

                    <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-100">
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">3. Tanlov sababi</p>
                      <p className="text-xs sm:text-sm font-medium text-slate-800 mt-1">{choiceReason}</p>
                    </div>

                    <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">4. Ehtimoliy oqibat</p>
                      <p className="text-xs sm:text-sm font-medium text-slate-800 mt-1">{choiceConsequence}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <button
                      onClick={() => setSituationStep(3)}
                      className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Tahrirlash
                    </button>
                    <button
                      disabled={submittingMoralChoice}
                      onClick={handleMoralChoiceSubmit}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-200 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {submittingMoralChoice ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <Check size={16} />
                      )}
                      <span>Ma'naviy qarorni tasdiqlash</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODUL 3: "EZGU ISHLARIM" (Merosdan Hayotga) */}
      {/* ========================================================================= */}
      {activeModule === 'good_deeds' && (
        <div className="space-y-6">
          {/* 1. Pedagogik Bog'lanish: Yaxlit Qadriyatlar Sikli Banneri */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-emerald-300 border border-white/10">
                <Sparkles size={14} /> Yaxlit Qadriyatlar Sikli: Anglashdan Amaliyotga
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  “Merosdan Hayotga” Pedagogik Zanjiri
                </h3>
                <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
                  Platformamiz faqat test topshirish emas, milliy ma’naviy merosdagi qadriyatni anglab, shaxsiy qaror qabul qilish va uni real hayotiy xatti-harakatga aylantirish tizimidir.
                </p>
              </div>

              {/* 4-Stage Visual Pedagogical Progression */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">1-bosqich</span>
                  <p className="text-xs sm:text-sm font-bold mt-1 text-white">“Meros izidan”</p>
                  <p className="text-[11px] text-indigo-200 mt-1 leading-snug">
                    Meros namunasidagi qadriyatli mazmunni anglaydi va tahlil qiladi.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">2-bosqich</span>
                  <p className="text-xs sm:text-sm font-bold mt-1 text-white">“Men qanday yo‘l tutaman?”</p>
                  <p className="text-[11px] text-indigo-200 mt-1 leading-snug">
                    Qadriyatli vaziyatda mustaqil ma'naviy tanlov va qaror qiladi.
                  </p>
                </div>

                <div className="bg-emerald-500/20 backdrop-blur-sm p-4 rounded-2xl border border-emerald-400/30">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">3-bosqich • Hozirgi modul</span>
                  <p className="text-xs sm:text-sm font-bold mt-1 text-emerald-200">“Ezgu ishlarim”</p>
                  <p className="text-[11px] text-emerald-100 mt-1 leading-snug">
                    Qadriyatni real hayotdagi aniq amaliy xatti-harakatga aylantiradi.
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/5 opacity-80 sm:col-span-3 lg:col-span-1">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Kelgusi bosqich</span>
                  <p className="text-xs sm:text-sm font-bold mt-1 text-slate-200">“O‘zimga nazar”</p>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Amalga oshirgan faoliyatini chuqur refleksiv baholaydi.
                  </p>
                </div>
              </div>

              {/* Cycle Example Preview */}
              <div className="bg-black/25 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-200 font-bold shrink-0">
                    Sikl misoli:
                  </span>
                  <span className="text-indigo-100">
                    Rivoyat: <strong className="text-white">“Beminnat yordam”</strong> → Ma’naviy tanlov: <strong className="text-white">“Katta yoshli insonga ko'mak”</strong> → Merosdan hayotga: <strong className="text-emerald-300">“Oila yoki sinfda bitta aniq ishda ko‘maklashish”</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Hero Card: "Bugungi ezgu ishim" (Har bir o'quvchiga modulga kirganda chiqadi) */}
          <div className="bg-white rounded-3xl sm:rounded-[32px] p-6 sm:p-8 border-2 border-emerald-500/20 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <HeartHandshake size={18} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Bugungi ezgu ishim
                </span>
              </div>
              {activeHeroTask?.value_name && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Qadriyat: {activeHeroTask.value_name}
                </span>
              )}
            </div>

            {/* Task Description */}
            <div className="mt-3">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {activeHeroTask?.title || "Merosdan hayotga: Mehnatsevarlik va ezgu niyat"}
              </h3>
              <p className="text-sm sm:text-base text-slate-700 mt-2 font-medium leading-relaxed bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/70">
                "{activeHeroTask?.description || "Bugun oilangizda yoki sinfda bajarilishi kerak bo‘lgan bir ishni sizga aytishlarini kutmasdan bajaring."}"
              </p>
            </div>

            {/* In-place Action or 3-Question Logging Form */}
            {!todayTaskStarted ? (
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-500 leading-snug">
                  * Topshiriqni real hayotda bajargach platformaga qayting. Faqat 3 ta sodda savol ochiladi.
                </p>
                <button
                  onClick={() => setTodayTaskStarted(true)}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shrink-0"
                >
                  <span>□ Bajarishga kirishaman</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 pt-5 border-t border-slate-100 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-700">Faoliyat bajarildi • 3 savol orqali qisqa qayd:</span>
                  </div>
                  <button
                    onClick={() => setTodayTaskStarted(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                </div>

                {/* 3 Sodda Savol (Boshlang'ich sinfga mos) */}
                <form onSubmit={(e) => handleGoodDeedSubmit(e, activeHeroTask?.id || null)} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      1. Nima qildim?
                    </label>
                    <textarea
                      rows={2}
                      value={deedWhatDone}
                      onChange={(e) => setDeedWhatDone(e.target.value)}
                      placeholder="Masalan: Buvimga hovlidagi gullarga suv quyishda yordam berdim..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      2. Kim bilan yoki kim uchun bajardim?
                    </label>
                    <input
                      type="text"
                      value={deedWithWhom}
                      onChange={(e) => setDeedWithWhom(e.target.value)}
                      placeholder="Masalan: Buvim uchun (yoki partadoshim bilan birga)..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      3. Qanday natija bo‘ldi?
                    </label>
                    <textarea
                      rows={2}
                      value={deedResultImpact}
                      onChange={(e) => setDeedResultImpact(e.target.value)}
                      placeholder="Masalan: Gullarga suv quyildi, buvimning ishi yengillashdi va xursand bo'ldilar..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                    <p className="text-[11px] text-slate-400 italic">
                      * Bolalar shaxsiy xavfsizligi uchun majburiy rasm yoki video talab qilinmaydi. Mazmuniy qayd yetarli.
                    </p>
                    <button
                      type="submit"
                      disabled={submittingDeed}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submittingDeed ? <span className="animate-spin">⏳</span> : <Check size={16} />}
                      <span>✓ Ezgu ishimni yakunladim</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {/* 3. “Merosdan hayotga” topshiriqlari banki (10 ta qadriyat) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                  “Merosdan hayotga” topshiriqlari banki
                </h4>
                <p className="text-xs text-slate-500">
                  Mavhum nasihat emas, kuzatiladigan aniq harakatlar talab qilinadi.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedTaskId(null);
                  setDeedWhatDone('');
                  setDeedWithWhom('');
                  setDeedResultImpact('');
                  setShowDeedModal(true);
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer self-start"
              >
                <PlusCircle size={15} /> Erkin ezgu amal qayd qilish
              </button>
            </div>

            {/* Qadriyatlar Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedBankValue('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedBankValue === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Barchasi ({goodDeedTasks.length})
              </button>
              {[
                "Mehr-oqibat",
                "Kattalarga hurmat",
                "Mehnatsevarlik",
                "Tejamkorlik",
                "Hamjihatlik",
                "Tabiatga g‘amxo‘rlik",
                "Mas’uliyat",
                "Do‘stlik",
                "Ne’matni qadrlash",
                "Obodonchilik"
              ].map((val) => (
                <button
                  key={val}
                  onClick={() => setSelectedBankValue(val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedBankValue === val
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            {/* Grid of Bank Tasks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {goodDeedTasks
                .filter(t => selectedBankValue === 'all' || t.value_name === selectedBankValue || t.category === selectedBankValue)
                .map((task) => {
                  const isActive = activeHeroTask?.id === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                        isActive
                          ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-emerald-400 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                            {task.value_name || task.category}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Faol topshiriq
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-sm text-slate-900 mt-1">
                          {task.title}
                        </h5>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {task.description}
                        </p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">
                          Merosdan hayotga
                        </span>
                        <button
                          onClick={() => {
                            setActiveHeroTask(task);
                            setSelectedTaskId(task.id);
                            setTodayTaskStarted(true);
                            window.scrollTo({ top: 350, behavior: 'smooth' });
                          }}
                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Bajarishga kirishaman
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 4. Ezgu ishlar kundaligi / Tarix (3 ta pedagogik holat bilan) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {role === 'student' ? 'Mening Ezgu Ishlarim Tarixi' : 'O\'quvchilar tomonidan qayd etilgan ezgu amallar'} ({goodDeedRecords.length})
                </h4>
                <p className="text-xs text-slate-500">
                  3 ta pedagogik bosqich: Qayd etildi → Ko‘rib chiqildi → Qayta aloqa berildi
                </p>
              </div>
            </div>

            {goodDeedRecords.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
                <HeartHandshake size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-600 font-bold text-sm">Hozircha ezgu amallar qayd etilmagan</p>
                <p className="text-xs text-slate-400 mt-1">Bugun birinchi yaxshi amalingizni bajaring va 3 ta savol orqali qayd qiling!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goodDeedRecords.map((record) => {
                  const status = record.status || (record.teacher_feedback ? 'feedback_given' : (record.teacher_verified ? 'reviewed' : 'submitted'));

                  return (
                    <div
                      key={record.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                              <HeartHandshake size={16} />
                            </div>
                            <div>
                              {record.student_name && (
                                <p className="text-xs font-bold text-slate-900">{record.student_name}</p>
                              )}
                              <p className="text-[10px] text-slate-400">
                                {new Date(record.created_at).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          {/* 3 Pedagogik Holat Nishonlari */}
                          {status === 'feedback_given' ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                              <CheckCircle2 size={13} /> Qayta aloqa berildi
                            </span>
                          ) : status === 'reviewed' ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 shrink-0">
                              <Eye size={13} /> Ko‘rib chiqildi
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 shrink-0">
                              <Clock size={13} /> Qayd etildi
                            </span>
                          )}
                        </div>

                        {record.task_title && (
                          <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50/70 px-2.5 py-1 rounded-lg">
                            Topshiriq: {record.task_title}
                          </div>
                        )}

                        {/* 3 Core Fields Display */}
                        <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                          <div>
                            <span className="font-bold text-slate-500">1. Nima qildim: </span>
                            <span className="text-slate-900 font-medium">{record.what_done}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">2. Kim bilan yoki kim uchun bajardim: </span>
                            <span className="text-slate-900 font-medium">{record.with_whom}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">3. Qanday natija bo‘ldi: </span>
                            <span className="text-slate-900 font-medium">{record.result_impact}</span>
                          </div>
                        </div>

                        {/* Teacher Pedagogical Feedback Display */}
                        {record.teacher_feedback && (
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs space-y-1">
                            <p className="font-bold text-emerald-800 flex items-center gap-1">
                              <Sparkles size={13} className="text-emerald-600" /> Pedagogik fikr (Qayta aloqa):
                            </p>
                            <p className="text-slate-800 italic leading-relaxed">
                              "{record.teacher_feedback}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Teacher Actions (Ko'rib chiqish va Qayta aloqa berish) */}
                      {(role === 'teacher' || role === 'admin') && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                          {verifyingDeedId === record.id ? (
                            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                              <label className="block text-[11px] font-bold text-slate-700">
                                Qisqa pedagogik fikr (Qayta aloqa) qoldiring:
                              </label>
                              <textarea
                                rows={2}
                                value={teacherFeedbackText}
                                onChange={(e) => setTeacherFeedbackText(e.target.value)}
                                placeholder="Masalan: Yordamni o‘zingiz taklif qilganingiz yaxshi. Keyingi safar yana qanday yordam ko‘rsatishingiz mumkinligini o‘ylab ko‘ring..."
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />

                              {/* Quick template suggestions */}
                              <div className="flex flex-wrap gap-1">
                                {[
                                  "Yordamni o‘zingiz taklif qilganingiz yaxshi. Keyingi safar yana qanday yordam ko‘rsatishingiz mumkinligini o‘ylab ko‘ring.",
                                  "Kattalarni hurmat qilish — eng ulug‘ fazilat. Barakalla!",
                                  "Isrofga yo‘l qo‘ymaslik orqali ne’matlarning qadriga yetayotganingiz juda quvonarli. Ofarin!",
                                  "Jamoada hamjihatlik bilan ishlash barakali natija beradi. Yashang!"
                                ].map((tmpl, tIdx) => (
                                  <button
                                    key={tIdx}
                                    type="button"
                                    onClick={() => setTeacherFeedbackText(tmpl)}
                                    className="text-[10px] bg-white hover:bg-emerald-50 text-slate-600 px-2 py-1 rounded-lg border border-slate-200 text-left line-clamp-1 cursor-pointer"
                                  >
                                    "{tmpl.substring(0, 35)}..."
                                  </button>
                                ))}
                              </div>

                              <div className="flex gap-2 justify-end pt-1">
                                <button
                                  onClick={() => setVerifyingDeedId(null)}
                                  className="px-3 py-1.5 text-xs text-slate-500 rounded-lg hover:bg-slate-200 cursor-pointer"
                                >
                                  Bekor qilish
                                </button>
                                <button
                                  onClick={() => handleVerifyDeed(record.id, teacherFeedbackText, 'feedback_given')}
                                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
                                >
                                  <Send size={12} /> Qayta aloqa yuborish
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleVerifyDeed(record.id, "Pedagog tomonidan ko‘rib chiqildi.", 'reviewed')}
                                className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye size={13} /> Ko‘rib chiqildi
                              </button>
                              <button
                                onClick={() => {
                                  setVerifyingDeedId(record.id);
                                  setTeacherFeedbackText(record.teacher_feedback || "Yordamni o‘zingiz taklif qilganingiz yaxshi. Keyingi safar yana qanday yordam ko‘rsatishingiz mumkinligini o‘ylab ko‘ring.");
                                }}
                                className="flex-1 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Edit3 size={13} /> Qayta aloqa berish
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Simple Modal for Free Logging of a Good Deed */}
          <AnimatePresence>
            {showDeedModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <HeartHandshake size={20} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">“Merosdan hayotga” Ezgu Amal Qaydi</h4>
                        <p className="text-xs text-slate-500">Faqat 3 ta sodda savol orqali qayd qiling</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDeedModal(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={(e) => handleGoodDeedSubmit(e, selectedTaskId)} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        1. Nima qildim?
                      </label>
                      <textarea
                        rows={2}
                        value={deedWhatDone}
                        onChange={(e) => setDeedWhatDone(e.target.value)}
                        placeholder="Masalan: Buvimga hovlidagi gullarga suv quyishda yordam berdim..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        2. Kim bilan yoki kim uchun bajardim?
                      </label>
                      <input
                        type="text"
                        value={deedWithWhom}
                        onChange={(e) => setDeedWithWhom(e.target.value)}
                        placeholder="Masalan: Buvim uchun (yoki sinfdoshim bilan birga)..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        3. Qanday natija bo‘ldi?
                      </label>
                      <textarea
                        rows={2}
                        value={deedResultImpact}
                        onChange={(e) => setDeedResultImpact(e.target.value)}
                        placeholder="Masalan: Gullarga suv quyildi, buvimning ishi yengillashdi..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                        required
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      * Boshlang'ich sinf yoshiga mos: faqat faoliyatning mazmuni muhim, foto/video shart emas.
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowDeedModal(false)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                      >
                        Bekor qilish
                      </button>
                      <button
                        type="submit"
                        disabled={submittingDeed}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {submittingDeed ? <span className="animate-spin">⏳</span> : <Check size={15} />}
                        <span>✓ Ezgu ishimni yakunladim</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODUL 4: MONITORING VA TAHLILLAR (Ustoz / Admin / Ota-ona uchun) */}
      {/* ========================================================================= */}
      {activeModule === 'monitoring' && (role === 'teacher' || role === 'admin' || role === 'psychologist' || role === 'parent') && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-xl font-extrabold text-slate-900">
              Qadriyatlar Monitoringi va Pedagogik Tahlillar
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              O'quvchilarning 6 ta ketma-ket savollarga bergan tahlillari, ma'naviy tanlov zanjirlari va amaliy ezgu ishlari.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Meros Tahlillari Submissions */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ScrollText size={18} className="text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-900">Meros Namunasi Tahlillari ({heritageSubmissions.length})</h4>
                </div>
              </div>

              {heritageSubmissions.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Hozircha tahlillar mavjud emas</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {heritageSubmissions.map((sub) => (
                    <div key={sub.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{sub.student_name || "O'quvchi"}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(sub.completed_at).toLocaleDateString('uz-UZ')}
                        </span>
                      </div>
                      <p className="font-bold text-indigo-700">Mavzu: {sub.material_title}</p>
                      {sub.values_direction && (
                        <p className="text-[11px] text-slate-500"><span className="font-bold">Qadriyat:</span> {sub.values_direction}</p>
                      )}
                      
                      <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-2 text-slate-700">
                        {Array.isArray(sub.answers) ? (
                          sub.answers.map((item: any, aIdx: number) => (
                            <div key={aIdx} className="border-b border-slate-100 last:border-b-0 pb-1.5 last:pb-0">
                              <p className="font-bold text-slate-800 text-[11px]">{item.questionNumber || aIdx + 1}. {item.question}</p>
                              <p className="text-slate-600 mt-0.5">{item.answer}</p>
                            </div>
                          ))
                        ) : typeof sub.answers === 'object' ? (
                          Object.entries(sub.answers).map(([k, v]: [string, any], aIdx: number) => (
                            <div key={aIdx} className="border-b border-slate-100 last:border-b-0 pb-1.5 last:pb-0">
                              <p className="font-bold text-slate-800 text-[11px]">{k}:</p>
                              <p className="text-slate-600 mt-0.5">{v}</p>
                            </div>
                          ))
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ma'naviy Tanlov Zanjirlari */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Compass size={18} className="text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-900">Ma'naviy Tanlov Zanjirlari ({moralChoices.length})</h4>
                </div>
              </div>

              {moralChoices.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Hozircha tanlovlar zanjiri kiritilmagan</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {moralChoices.map((choice) => (
                    <div key={choice.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{choice.student_name || "O'quvchi"}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(choice.created_at).toLocaleDateString('uz-UZ')}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800">{choice.situation_title}</p>
                      <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1.5 text-slate-700">
                        <p><span className="font-bold text-indigo-700">Tanlangan yo'l:</span> {choice.selected_option_text}</p>
                        <p><span className="font-bold text-amber-700">Tanlov sababi:</span> {choice.reason}</p>
                        <p><span className="font-bold text-emerald-700">Kutilgan oqibat:</span> {choice.expected_consequence}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEACHER / ADMIN: Content Creator Modal */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <PlusCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">Yangi Qadriyatli Material Qo'shish</h4>
                    <p className="text-xs text-slate-500">Ustoz va admin boshqaruvi</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Module type selection */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCreateCategory('heritage')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    createCategory === 'heritage'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  1. Meros Namunasi
                </button>
                <button
                  type="button"
                  onClick={() => setCreateCategory('situation')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    createCategory === 'situation'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  2. Ma'naviy Vaziyat
                </button>
                <button
                  type="button"
                  onClick={() => setCreateCategory('task')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    createCategory === 'task'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  3. Ezgu Ish Topshirig'i
                </button>
              </div>

              <form onSubmit={handleCreateNewContent} className="space-y-4">
                {createCategory === 'heritage' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mavzu / Nomi</label>
                      <input
                        type="text"
                        value={newMatTitle}
                        onChange={(e) => setNewMatTitle(e.target.value)}
                        placeholder="Masalan: Omonatga xiyonat qilmaslik"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Qadriyatli yo‘nalish</label>
                        <input
                          type="text"
                          value={newMatValues}
                          onChange={(e) => setNewMatValues(e.target.value)}
                          placeholder="Masalan: halollik, mas’uliyat"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Mazmuniy bog‘lanish</label>
                        <input
                          type="text"
                          value={newMatConnection}
                          onChange={(e) => setNewMatConnection(e.target.value)}
                          placeholder="Masalan: Tarbiya fani"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Rivoyat Matni</label>
                      <textarea
                        rows={4}
                        value={newMatContent}
                        onChange={(e) => setNewMatContent(e.target.value)}
                        placeholder="Meros namunasining to'liq matnini kiriting..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">Ketma-ket tahlil savollari (kamida 3-6 ta)</label>
                      {newMatQuestions.map((q, i) => (
                        <input
                          key={i}
                          type="text"
                          value={q}
                          onChange={(e) => {
                            const updated = [...newMatQuestions];
                            updated[i] = e.target.value;
                            setNewMatQuestions(updated);
                          }}
                          placeholder={`${i + 1}-savol matni...`}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      ))}
                    </div>
                  </>
                )}

                {createCategory === 'situation' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Vaziyat Sarlavhasi</label>
                      <input
                        type="text"
                        value={newSitTitle}
                        onChange={(e) => setNewSitTitle(e.target.value)}
                        placeholder="Masalan: Kitobxonlik va qadriyat tanlovi"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kategoriya</label>
                      <input
                        type="text"
                        value={newSitCategory}
                        onChange={(e) => setNewSitCategory(e.target.value)}
                        placeholder="Halollik va omonatdorlik, Kattalarga hurmat..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Qadriyatli Yo'nalish</label>
                      <input
                        type="text"
                        value={newSitValuesDirection}
                        onChange={(e) => setNewSitValuesDirection(e.target.value)}
                        placeholder="Masalan: halollik, o‘zgalar mulkiga hurmat"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hayotiy Vaziyat Matni</label>
                      <textarea
                        rows={3}
                        value={newSitText}
                        onChange={(e) => setNewSitText(e.target.value)}
                        placeholder="O'quvchi duch keladigan real maktab yoki hayotiy holatni tasvirlang..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">"Tanlovimni asoslayman" savoli</label>
                      <input
                        type="text"
                        value={newSitReasonPrompt}
                        onChange={(e) => setNewSitReasonPrompt(e.target.value)}
                        placeholder="Nima uchun aynan shu yo‘lni tanladingiz?..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">"Oqibatini o‘ylayman" savoli</label>
                      <input
                        type="text"
                        value={newSitConsequencePrompt}
                        onChange={(e) => setNewSitConsequencePrompt(e.target.value)}
                        placeholder="Sizningcha, bu qarorning oqibati qanday bo‘ladi?..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">Muqobil Harakat Variantlari (kamida 2-3 ta)</label>
                      {newSitOptions.map((opt, i) => (
                        <input
                          key={i}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newSitOptions];
                            updated[i] = e.target.value;
                            setNewSitOptions(updated);
                          }}
                          placeholder={`Variant ${i + 1}`}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      ))}
                    </div>
                  </>
                )}

                {createCategory === 'task' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Topshiriq Nomi</label>
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Masalan: Partadoshga mehr"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Yo'nalish / Kategoriya</label>
                      <input
                        type="text"
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value)}
                        placeholder="Ko'mak, Kattalarga hurmat, Tabiat..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Topshiriq Tavsifi</label>
                      <textarea
                        rows={3}
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                        placeholder="Bugun bajarilishi kerak bo'lgan aniq ezgu ish yo'riqnomasi..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={15} /> Qo'shish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
