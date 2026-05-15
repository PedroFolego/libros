'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { Plus, Search, Book as BookIcon } from 'lucide-react';
import type { Book, BookStatus } from '@/types';
import Sidebar from './Sidebar';
import BookCard from './BookCard';
import BookDetail from './BookDetail';
import AddBookModal from './AddBookModal';

interface LibraryClientProps {
  initialBooks: Book[];
  userAvatar: string;
}

export default function LibraryClient({ initialBooks, userAvatar }: LibraryClientProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<BookStatus>('all');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedBook = useMemo(() => initialBooks.find(b => b.id === selectedBookId), [initialBooks, selectedBookId]);

  const filteredBooks = useMemo(() => {
    return initialBooks.filter(book => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'all' || book.status === activeFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [initialBooks, searchTerm, activeFilter]);

  const addBook = async (data: { title: string; author: string; status: Exclude<BookStatus, 'all'> }) => {
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Falha ao adicionar livro');
      setIsAdding(false);
      router.refresh();
    } catch {
      alert('Erro ao adicionar livro. Tente novamente.');
    }
  };

  const updateBook = async (id: string, updates: Partial<Pick<Book, 'status' | 'rating'>>) => {
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Falha ao atualizar livro');
      router.refresh();
    } catch {
      alert('Erro ao atualizar livro. Tente novamente.');
    }
  };

  const deleteBook = async (id: string) => {
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover livro');
      setSelectedBookId(null);
      router.refresh();
    } catch {
      alert('Erro ao remover livro. Tente novamente.');
    }
  };

  const addAnnotation = async (bookId: string, content: string) => {
    try {
      const res = await fetch(`/api/books/${bookId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Falha ao salvar anotação');
      router.refresh();
    } catch {
      alert('Erro ao salvar anotação. Tente novamente.');
    }
  };

  const deleteAnnotation = async (bookId: string, annotationId: string) => {
    try {
      const res = await fetch(`/api/books/${bookId}/annotations?annotationId=${annotationId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover anotação');
      router.refresh();
    } catch {
      alert('Erro ao remover anotação. Tente novamente.');
    }
  };

  return (
    <>
      {/* Nav */}
      <nav className="h-16 px-6 sm:px-8 flex items-center justify-between bg-white border-b border-brand-border sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => { setSelectedBookId(null); setActiveFilter('all'); }}
        >
          <div className="w-8 h-8 bg-brand-primary rounded flex items-center justify-center">
            <BookIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight uppercase">Libros</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (selectedBookId) setSelectedBookId(null);
              }}
              className="pl-8 pr-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs focus:ring-1 focus:ring-brand-primary outline-none w-32 sm:w-64 transition-all"
            />
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-brand-primary text-white p-2 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </nav>

      {/* Main grid */}
      <main className="max-w-[1200px] mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4">
        <aside className="md:col-span-3 space-y-4">
          <Sidebar
            books={initialBooks}
            activeFilter={activeFilter}
            selectedBookId={selectedBookId}
            onFilterChange={(f) => { setActiveFilter(f); setSelectedBookId(null); }}
          />
        </aside>

        <section className="md:col-span-9 space-y-4">
          {selectedBook ? (
            <BookDetail
              book={selectedBook}
              onBack={() => setSelectedBookId(null)}
              onUpdateBook={updateBook}
              onDeleteBook={deleteBook}
              onAddAnnotation={addAnnotation}
              onDeleteAnnotation={deleteAnnotation}
            />
          ) : filteredBooks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-border p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 bg-brand-bg rounded-2xl flex items-center justify-center mb-6 border border-brand-border">
                <Search className="w-8 h-8 text-brand-muted" />
              </div>
              <h2 className="text-2xl font-display italic mb-2">Página em branco...</h2>
              <p className="text-brand-muted max-w-xs mx-auto text-sm leading-relaxed">
                {searchTerm ? 'Nenhum livro encontrado para sua busca.' : 'Sua biblioteca está vazia. Que tal catalogar seu primeiro livro hoje?'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredBooks.map((book, idx) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    index={idx}
                    searchTerm={searchTerm}
                    onSelect={setSelectedBookId}
                    onUpdateStatus={(id, status) => updateBook(id, { status })}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && <AddBookModal onAdd={addBook} onClose={() => setIsAdding(false)} />}
      </AnimatePresence>
    </>
  );
}
