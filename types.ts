export type BookStatus = 'reading' | 'want-to-read' | 'finished' | 'all';

export interface Annotation {
  id: string;
  content: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  annotations: Annotation[];
  status: Exclude<BookStatus, 'all'>;
  rating: number;
  createdAt: string;
}
