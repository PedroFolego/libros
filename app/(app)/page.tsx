import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import LibraryClient from '@/components/LibraryClient';
import type { Book, BookStatus } from '@/types';

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const rawBooks = await prisma.book.findMany({
    where: { userId: session.user.id },
    include: { annotations: { orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });

  const books: Book[] = rawBooks.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    status: b.status as Exclude<BookStatus, 'all'>,
    rating: b.rating,
    createdAt: b.createdAt.toISOString(),
    annotations: b.annotations.map((a) => ({
      id: a.id,
      content: a.content,
      createdAt: a.createdAt.toISOString(),
    })),
  }));

  const name = session.user.name ?? '';
  const userInitials = name
    .split(' ')
    .filter((n) => n.length > 0)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <LibraryClient
      initialBooks={books}
      userInitials={userInitials}
      userImage={session.user.image}
    />
  );
}
