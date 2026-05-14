import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let body: { status?: string; rating?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { status, rating } = body;
  const safeUpdates: { status?: string; rating?: number } = {};
  if (status !== undefined) safeUpdates.status = status;
  if (rating !== undefined) safeUpdates.rating = rating;

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (book.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await prisma.book.update({
    where: { id },
    data: safeUpdates,
    include: { annotations: { orderBy: { createdAt: 'desc' } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (book.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.book.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
