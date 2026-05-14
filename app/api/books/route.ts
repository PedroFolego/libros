import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    include: { annotations: { orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(books);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, author, status } = await request.json();
  if (!title || !author || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const book = await prisma.book.create({
    data: { title, author, status, userId: session.user.id },
    include: { annotations: true },
  });

  return NextResponse.json(book, { status: 201 });
}
