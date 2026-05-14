import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import LibraryClient from '@/components/LibraryClient';
import type { Book } from '@/types';

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const rawBooks = await prisma.book.findMany({
    where: { userId: session.user.id },
    include: { annotations: { orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });

  const books: Book[] = rawBooks.map((b) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    annotations: b.annotations.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  }));

  const name = session.user.name ?? '';
  const userInitials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <LibraryClient
      initialBooks={books}
      userInitials={userInitials}
      userImage={session.user.image}
    />
  );
}
