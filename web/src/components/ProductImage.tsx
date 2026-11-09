import { useState } from 'react';
import { cn } from '../lib/utils';

type ProductImageProps = {
  src?: string | null;
  alt: string;
  accent?: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
};

/**
 * Product imagery with a deterministic fallback.
 *
 * The catalogue ships its own images under /products. If one is missing, slow
 * or blocked, the card still renders the product's brand accent and initial
 * instead of a broken-image icon.
 */
export function ProductImage({ src, alt, accent = '#1F3D2B', className, imgClassName, eager }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn('relative overflow-hidden bg-ink', className)}
      style={{ background: `linear-gradient(150deg, ${accent} 0%, #0B0C0E 120%)` }}
    >
      {showImage ? (
        <img
          src={src!}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover object-center', imgClassName)}
        />
      ) : (
        <div className="relative grid h-full w-full place-items-center" aria-label={alt}>
          <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/15" />
          <span className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 rounded-full border border-white/10" />
          <span className="font-display text-4xl tracking-tight text-white/30">{alt.slice(0, 1)}</span>
        </div>
      )}
    </div>
  );
}
