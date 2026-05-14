'use client';

import { motion } from 'motion/react';
import { MessageSquare, Bookmark, BookOpen, CheckCircle2 } from 'lucide-react';
import type { Book, BookStatus } from '@/types';
import Rating from './Rating';

interface BookCardProps {
  book: Book;
  index: number;
  searchTerm: string;
  onSelect: (id: string) => void;
  onUpdateStatus: (id: string, status: Exclude<BookStatus, 'all'>) => void;
}

export default function BookCard({ book, index, searchTerm, onSelect, onUpdateStatus }: BookCardProps) {
  const isFeatured = index === 0 && !searchTerm;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-2xl border border-brand-border p-6 flex flex-col h-full hover:shadow-xl hover:shadow-black/[0.02] transition-all group overflow-hidden cursor-pointer ${isFeatured ? 'lg:col-span-2 flex-row gap-8 items-center bg-gradient-to-br from-white to-[#F9F8F6]' : ''}`}
      onClick={() => onSelect(book.id)}
    >
      {isFeatured ? (
        <>
          <div className="w-24 h-36 sm:w-32 sm:h-48 bg-brand-primary rounded shadow-xl shrink-0 flex flex-col items-center justify-center p-3 text-center text-white">
            <p className="text-[6px] sm:text-[8px] uppercase tracking-widest opacity-60 mb-1">{book.author}</p>
            <h4 className="text-xs sm:text-sm font-display leading-[1.2] line-clamp-3">{book.title}</h4>
            <div className="mt-auto w-8 h-0.5 bg-white/30" />
          </div>
          <div className="flex-grow flex flex-col gap-4">
            <div>
              <span className="px-2 py-0.5 bg-brand-border text-[9px] font-bold uppercase rounded-md text-brand-text">
                {book.status === 'reading' ? 'Lendo Agora' : book.status === 'finished' ? 'Concluído' : 'Lista de Leitura'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-display mt-2 leading-tight truncate">{book.title}</h3>
              <p className="text-brand-muted italic text-sm">{book.author}</p>
            </div>
            <div className="flex items-center gap-2 mt-auto">
              <span className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-lg flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                {book.annotations.length > 0 ? `${book.annotations.length} Notas` : 'Anotar'}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-grow min-w-0">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider mb-1 ${
                book.status === 'reading' ? 'bg-amber-100 text-amber-800' :
                book.status === 'finished' ? 'bg-emerald-100 text-emerald-800' :
                'bg-brand-bg text-brand-muted border border-brand-border'
              }`}>
                {book.status === 'reading' ? 'Lendo' : book.status === 'finished' ? 'Lido' : 'Para ler'}
              </span>
              <h3 className="text-lg font-bold leading-snug truncate">{book.title}</h3>
              <p className="text-brand-muted text-xs font-medium truncate mb-1">{book.author}</p>
              <Rating value={book.rating} size={12} />
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-brand-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(Math.min(3, book.annotations.length))].map((_, i) => (
                  <div key={i} className="w-4 h-4 rounded-full bg-brand-border border border-white" />
                ))}
              </div>
              <span className="text-[10px] font-bold text-brand-muted uppercase">
                {book.annotations.length === 0 ? 'Sem notas' : `${book.annotations.length} notas`}
              </span>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
              {([
                { s: 'want-to-read', Icon: Bookmark },
                { s: 'reading', Icon: BookOpen },
                { s: 'finished', Icon: CheckCircle2 },
              ] as const).map(({ s, Icon }) => (
                <button
                  key={s}
                  onClick={() => onUpdateStatus(book.id, s)}
                  className={`p-1 rounded-lg border transition-all ${book.status === s ? 'bg-brand-primary border-brand-primary text-white' : 'border-brand-border text-brand-muted'}`}
                >
                  <Icon className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {book.annotations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-brand-border line-clamp-2 italic text-xs text-brand-muted leading-relaxed">
          &quot;{book.annotations[0].content}&quot;
        </div>
      )}
    </motion.div>
  );
}
