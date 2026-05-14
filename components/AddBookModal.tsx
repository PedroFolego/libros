'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, BookOpen, CheckCircle2 } from 'lucide-react';
import type { BookStatus } from '@/types';

interface AddBookModalProps {
  onAdd: (data: { title: string; author: string; status: Exclude<BookStatus, 'all'> }) => void;
  onClose: () => void;
}

export default function AddBookModal({ onAdd, onClose }: AddBookModalProps) {
  const [form, setForm] = useState({
    title: '',
    author: '',
    status: 'want-to-read' as Exclude<BookStatus, 'all'>,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author) return;
    onAdd(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-primary/20 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 border border-brand-border shadow-2xl"
      >
        <h2 className="text-3xl font-display mb-8">Novo Livro</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-brand-muted tracking-[0.15em] ml-1">Título</label>
            <input
              autoFocus
              required
              type="text"
              placeholder="Ex: O Pequeno Príncipe"
              className="w-full px-5 py-4 bg-brand-bg border border-brand-border rounded-xl text-brand-text focus:ring-1 focus:ring-brand-primary outline-none transition-all"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-brand-muted tracking-[0.15em] ml-1">Autor</label>
            <input
              required
              type="text"
              placeholder="Ex: Antoine de Saint-Exupéry"
              className="w-full px-5 py-4 bg-brand-bg border border-brand-border rounded-xl text-brand-text focus:ring-1 focus:ring-brand-primary outline-none transition-all"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'want-to-read', label: 'Lista', icon: Bookmark },
              { id: 'reading', label: 'Lendo', icon: BookOpen },
              { id: 'finished', label: 'Lido', icon: CheckCircle2 },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setForm({ ...form, status: s.id as Exclude<BookStatus, 'all'> })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${form.status === s.id ? 'border-brand-primary bg-brand-primary text-white' : 'border-brand-bg bg-brand-bg text-brand-muted'}`}
              >
                <s.icon className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase">{s.label}</span>
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold uppercase text-sm tracking-widest shadow-lg shadow-brand-primary/20 hover:opacity-90 transition-opacity mt-4"
          >
            Adicionar à Estante
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-brand-muted font-semibold text-xs hover:text-brand-text transition-colors"
          >
            Cancelar
          </button>
        </form>
      </motion.div>
    </div>
  );
}
