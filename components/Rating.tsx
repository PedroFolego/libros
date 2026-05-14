'use client';

import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  interactive?: boolean;
}

export default function Rating({ value, onChange, size = 16, interactive = false }: RatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${star <= value ? 'fill-amber-400 text-amber-400' : 'text-brand-border'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={interactive && onChange ? (e) => { e.stopPropagation(); onChange(star); } : undefined}
        />
      ))}
    </div>
  );
}
