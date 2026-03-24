import { Star } from 'lucide-react';

export default function RatingStars({ value = 0, max = 5, size = 14, interactive = false, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(value);
        return (
          <Star
            key={i}
            size={size}
            fill={filled ? 'var(--yellow)' : 'none'}
            color={filled ? 'var(--yellow)' : 'var(--surface-3)'}
            style={{ cursor: interactive ? 'pointer' : 'default', transition: 'color 0.15s, fill 0.15s' }}
            onClick={() => interactive && onChange && onChange(i + 1)}
          />
        );
      })}
    </div>
  );
}
