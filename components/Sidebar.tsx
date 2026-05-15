'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Bookmark, CheckCircle2, Sparkles, Copy, Check, X } from 'lucide-react';
import type { Book, BookStatus } from '@/types';

interface SidebarProps {
  books: Book[];
  activeFilter: BookStatus;
  selectedBookId: string | null;
  onFilterChange: (filter: BookStatus) => void;
}

export default function Sidebar({ books, activeFilter, selectedBookId, onFilterChange }: SidebarProps) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  const filters = [
    { id: 'all' as BookStatus, icon: BookOpen, label: 'Todos', count: books.length },
    { id: 'reading' as BookStatus, icon: BookOpen, label: 'Lendo agora', count: books.filter(b => b.status === 'reading').length },
    { id: 'want-to-read' as BookStatus, icon: Bookmark, label: 'Para ler', count: books.filter(b => b.status === 'want-to-read').length },
    { id: 'finished' as BookStatus, icon: CheckCircle2, label: 'Concluídos', count: books.filter(b => b.status === 'finished').length },
  ];

  const finishedBooks = books
    .filter(b => b.status === 'finished')
    .sort((a, b) => b.rating - a.rating);

  const bookListText = finishedBooks.map(b => `${b.title} — ${b.author}: ${b.rating}/5`).join('\n');
  const recommendationPrompt = finishedBooks.length > 0
    ? `Você é um especialista em literatura. Com base nos livros que já li e nas notas que dei a cada um, recomende 5 livros que eu provavelmente vou adorar. Para cada sugestão, explique brevemente por que ela combina com meu gosto.\n\nLivros que já li:\n${bookListText}\n\nPor favor, recomende livros que eu ainda não li e que se alinhem ao meu perfil de leitor.`
    : '';

  // Close modal on Escape key
  useEffect(() => {
    if (!isSummaryOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSummaryOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSummaryOpen]);

  // Return focus to trigger button when modal closes
  useEffect(() => {
    if (!isSummaryOpen && triggerButtonRef.current) {
      triggerButtonRef.current.focus();
    }
  }, [isSummaryOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recommendationPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — do not show success feedback
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-brand-border p-6 flex flex-col gap-6 h-full shadow-sm">
        <div>
          <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-4">Minha Biblioteca</h3>
          <ul className="space-y-2">
            {filters.map((item) => {
              const isActive = activeFilter === item.id && !selectedBookId;
              return (
                <li
                  key={item.id}
                  onClick={() => onFilterChange(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isActive ? 'bg-brand-bg border-brand-border' : 'border-transparent text-brand-muted hover:bg-brand-bg/50'}`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : ''}`} />
                  <span className={`text-sm ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                  <span className="ml-auto text-xs opacity-40">{item.count}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-4">Ferramentas</h3>
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => setIsSummaryOpen(true)}
            className="w-full flex items-center gap-3 p-3 text-sm text-brand-muted hover:text-brand-text hover:bg-brand-bg/50 rounded-xl transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Recomendar com IA</span>
          </button>
        </div>

        <div className="mt-auto p-4 bg-brand-primary rounded-xl text-white shadow-lg shadow-brand-primary/10">
          <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Total lidos</p>
          <p className="text-xl font-display italic">{finishedBooks.length} livros</p>
          <div className="w-full h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (finishedBooks.length / 10) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      <AnimatePresence>
        {isSummaryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSummaryOpen(false)}
              className="absolute inset-0 bg-brand-primary/20 backdrop-blur-md"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="prompt-modal-title"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-8 sm:p-10 border border-brand-border shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 id="prompt-modal-title" className="text-3xl font-display">Prompt de Recomendação</h2>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={() => setIsSummaryOpen(false)}
                  className="p-2 border border-brand-border rounded-lg text-brand-muted hover:text-brand-text transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-brand-muted text-sm mb-6">Copie o prompt abaixo e cole em qualquer IA para receber sugestões personalizadas.</p>
              <div
                className="flex-grow overflow-y-auto bg-brand-bg rounded-2xl p-6 font-mono text-xs leading-relaxed border border-brand-border"
                tabIndex={0}
                aria-label="Prompt de recomendação"
              >
                {finishedBooks.length === 0 ? (
                  <p className="text-center py-10 text-brand-muted">Nenhum livro marcado como &quot;Lido&quot;.</p>
                ) : (
                  <pre className="whitespace-pre-wrap text-brand-primary">{recommendationPrompt}</pre>
                )}
              </div>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={finishedBooks.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-brand-primary text-white rounded-xl font-bold uppercase text-sm tracking-widest shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar tudo
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
