import React from 'react';
import { Key, X, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentCredentialsModalProps {
  editingStudent: { id: number; name: string; username: string; password: string } | null;
  onClose: () => void;
  onSave: (id: number, username: string, password: string) => Promise<void>;
}

export const StudentCredentialsModal: React.FC<StudentCredentialsModalProps> = ({
  editingStudent,
  onClose,
  onSave
}) => {
  if (!editingStudent) return null;

  const [username, setUsername] = React.useState(editingStudent.username || '');
  const [password, setPassword] = React.useState(editingStudent.password || '');
  const [isSaving, setIsSaving] = React.useState(false);

  const handleAutoGenerateLogin = () => {
    // Generate clean username from name, e.g., 'jasur1' or 'jasur74'
    const namePart = editingStudent.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'talaba';
    const rand = Math.floor(10 + Math.random() * 90);
    setUsername(`${namePart}${rand}`);
  };

  const handleAutoGeneratePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
    let pass = 'Talaba';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += '!';
    setPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setIsSaving(true);
    try {
      await onSave(editingStudent.id, username.trim(), password.trim());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="bg-white rounded-3xl sm:rounded-[32px] p-6 sm:p-8 w-full max-w-md shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-md shadow-amber-50">
            <Key size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">O'quvchiga Login/Parol Berish</h3>
            <p className="text-xs text-slate-500 font-medium">{editingStudent.name}</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed">
          Ushbu login va parol yordamida o'quvchi tizimga kirib, berilgan topshiriqlar va dars mashqlarini bajara oladi.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">O'quvchi Logini</label>
              <button 
                type="button"
                onClick={handleAutoGenerateLogin}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Sparkles size={12} /> Avto-login
              </button>
            </div>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono text-slate-900"
              placeholder="Masalan: jasur1"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Yangi Parol</label>
              <button 
                type="button"
                onClick={handleAutoGeneratePassword}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Sparkles size={12} /> Avto-parol
              </button>
            </div>
            <input 
              type="text" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono text-slate-900"
              placeholder="Masalan: Jasur123!"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm"
            >
              Bekor qilish
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-amber-100 text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck size={16} /> Saqlash va Berish
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
