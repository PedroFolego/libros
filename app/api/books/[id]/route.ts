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
  const VALID_STATUSES = ['reading', 'want-to-read', 'finished'];
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  const safeUpdates: { status?: string; rating?: number } = {};
  if (status !== undefined) safeUpdates.status = status;
  if (rating !== undefined) {
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 0 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 0 and 5' }, { status: 400 });
    }
    safeUpdates.rating = rating;
  }
  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

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
