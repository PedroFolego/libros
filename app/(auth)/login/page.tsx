import { signIn } from '@/lib/auth';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-brand-border p-10 w-full max-w-sm shadow-sm text-center">
        <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-display mb-2">Libros</h1>
        <p className="text-brand-muted text-sm mb-8">Sua biblioteca pessoal</p>
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold uppercase text-sm tracking-widest hover:opacity-90 transition-opacity"
          >
            Entrar com Google
          </button>
        </form>
      </div>
    </div>
  );
}
