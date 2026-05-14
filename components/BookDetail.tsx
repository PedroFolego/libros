'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, MessageSquare, BookOpen, CheckCircle2, Bookmark, ArrowLeft } from 'lucide-react';
import type { Book, BookStatus } from '@/types';
import Rating from './Rating';

interface BookDetailProps {
  book: Book;
  onBack: () => void;
  onUpdateBook: (id: string, updates: Partial<Pick<Book, 'status' | 'rating'>>) => void;
  onDeleteBook: (id: string) => void;
  onAddAnnotation: (bookId: string, content: string) => void;
  onDeleteAnnotation: (bookId: string, annotationId: string) => void;
}

export default function BookDetail({
  book,
  onBack,
  onUpdateBook,
  onDeleteBook,
  onAddAnnotation,
  onDeleteAnnotation,
}: BookDetailProps) {
  const [newAnnotation, setNewAnnotation] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="bg-white rounded-2xl border border-brand-border p-8 flex flex-col sm:flex-row gap-8 items-start sm:items-center bg-gradient-to-br from-white to-[#F9F8F6]">
        <div className="w-32 h-48 bg-brand-primary rounded shadow-2xl shrink-0 flex flex-col items-center justify-center p-4 text-center text-white">
          <p className="text-[8px] uppercase tracking-widest opacity-60 mb-2">{book.author}</p>
          <h2 className="text-lg font-display leading-[1.2] line-clamp-4">{book.title}</h2>
          <div className="mt-auto w-10 h-0.5 bg-white/30" />
        </div>
        <div className="flex-grow space-y-4 w-full">
          <div>
            <button
              onClick={onBack}
              className="text-brand-muted hover:text-brand-text flex items-center gap-1 text-xs font-bold uppercase tracking-widest mb-2"
            >
              <ArrowLeft className="w-3 h-3" /> Voltar
            </button>
            <h1 className="text-4xl font-display leading-tight">{book.title}</h1>
            <p className="text-brand-muted italic text-lg">{book.author}</p>
            <div className="mt-2">
              <Rating
                value={book.rating}
                interactive
                onChange={(v) => onUpdateBook(book.id, { rating: v })}
                size={24}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: 'want-to-read', label: 'Lista', Icon: Bookmark },
              { id: 'reading', label: 'Lendo', Icon: BookOpen },
              { id: 'finished', label: 'Lido', Icon: CheckCircle2 },
            ] as const).map((s) => (
              <button
                key={s.id}
                onClick={() => onUpdateBook(book.id, { status: s.id })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all text-xs font-bold uppercase tracking-widest ${book.status === s.id ? 'bg-brand-primary border-brand-primary text-white shadow-md' : 'bg-white border-brand-border text-brand-muted hover:border-brand-primary hover:text-brand-primary'}`}
              >
                <s.Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            ))}
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja remover este livro?')) {
                  onDeleteBook(book.id);
                }
              }}
              className="ml-auto p-2 text-brand-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Annotations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-brand-border p-6 flex flex-col shadow-sm">
          <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-4">Nova Anotação</h3>
          <textarea
            value={newAnnotation}
            onChange={(e) => setNewAnnotation(e.target.value)}
            placeholder="O que esta obra te faz pensar agora?"
            className="flex-grow w-full bg-brand-bg rounded-xl p-4 text-sm font-medium border-none focus:ring-1 focus:ring-brand-primary outline-none transition-all resize-none min-h-[150px]"
          />
          <button
            onClick={() => {
              if (newAnnotation.trim()) {
                onAddAnnotation(book.id, newAnnotation);
                setNewAnnotation('');
              }
            }}
            className="mt-4 w-full py-3 bg-brand-primary text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md hover:opacity-90 transition-opacity"
          >
            Salvar Pensamento
          </button>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-brand-border p-6 shadow-sm min-h-[400px]">
          <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-6">
            Anotações Anteriores ({book.annotations.length})
          </h3>
          <div className="space-y-4">
            {book.annotations.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                <p className="font-display italic">Nenhuma anotação ainda...</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {book.annotations.map((ann) => (
                  <motion.div
                    key={ann.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-brand-bg/50 border-l-4 border-brand-primary rounded-r-xl relative group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[8px] font-bold text-brand-muted uppercase tracking-widest">
                        {new Date(ann.createdAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(ann.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => onDeleteAnnotation(book.id, ann.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-brand-muted hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-brand-text leading-relaxed whitespace-pre-wrap">
                      {ann.content}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
