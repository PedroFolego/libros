import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

interface BookEntry {
  title: string;
  author: string;
  rating: number;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.user.isPremium) {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 });
  }

  let body: { books?: BookEntry[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const books = body.books;
  if (!books || books.length === 0) {
    return NextResponse.json({ error: 'books array is required and must not be empty' }, { status: 400 });
  }

  const bookListText = books.map(b => `${b.title} — ${b.author}: ${b.rating}/5`).join('\n');
  const prompt = `Você é um especialista em literatura. Com base nos livros que já li e nas notas que dei a cada um, recomende 5 livros que eu provavelmente vou adorar. Para cada sugestão, explique brevemente por que ela combina com meu gosto.\n\nLivros que já li:\n${bookListText}\n\nPor favor, recomende livros que eu ainda não li e que se alinhem ao meu perfil de leitor.`;

  return NextResponse.json({ prompt });
}
