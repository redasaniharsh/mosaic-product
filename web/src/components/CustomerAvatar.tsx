import { useState } from 'react';
import { cn } from '../lib/utils';

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/**
 * Customer portrait with a monogram fallback.
 *
 * Portraits live under /avatars and are optional: the five research
 * conversations still read as people when a photo has not been supplied yet,
 * instead of showing a broken-image icon.
 */
export function CustomerAvatar({
  src,
  name,
  tone = 'light',
  className
}: {
  src?: string | null;
  name: string;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-full border',
        tone === 'dark'
          ? 'border-paper/25 bg-paper/10 text-paper/80'
          : 'border-forest/15 bg-forest/[0.06] text-forest',
        className
      )}
    >
      {showImage ? (
        <img
          src={src!}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-mono text-[10px] font-medium leading-none tracking-[0.04em]" aria-hidden>
          {initials(name)}
        </span>
      )}
    </span>
  );
}
