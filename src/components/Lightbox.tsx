import { useEffect, useRef, useState } from 'react';

/**
 * Visionneuse plein écran : affiche les images en grand (entières, non rognées),
 * avec navigation par flèches, clavier (← → Échap) et balayage tactile.
 */
export function Lightbox({
  images,
  index,
  alt,
  onClose,
  onIndexChange,
}: {
  images: string[];
  index: number;
  alt?: string;
  onClose: () => void;
  onIndexChange?: (i: number) => void;
}) {
  const [i, setI] = useState(index);
  const touchX = useRef<number | null>(null);

  const go = (next: number) => {
    const v = (next + images.length) % images.length;
    setI(v);
    onIndexChange?.(v);
  };
  const prev = () => go(i - 1);
  const next = () => go(i + 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, images.length]);

  const onTouchStart = (e: React.TouchEvent) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) (dx > 0 ? prev : next)();
  };

  const multiple = images.length > 1;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Galerie photos"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button className="lightbox__close" onClick={onClose} aria-label="Fermer">
        ✕
      </button>

      {multiple && (
        <button
          className="lightbox__nav lightbox__nav--prev"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Image précédente"
        >
          ‹
        </button>
      )}

      <img
        className="lightbox__img"
        src={images[i]}
        alt={alt ?? `Photo ${i + 1}`}
        onClick={(e) => e.stopPropagation()}
      />

      {multiple && (
        <button
          className="lightbox__nav lightbox__nav--next"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Image suivante"
        >
          ›
        </button>
      )}

      {multiple && (
        <div className="lightbox__dots" onClick={(e) => e.stopPropagation()}>
          {images.map((src, k) => (
            <button
              key={src + k}
              className={k === i ? 'lightbox__dot lightbox__dot--on' : 'lightbox__dot'}
              onClick={() => go(k)}
              aria-label={`Aller à la photo ${k + 1}`}
            />
          ))}
        </div>
      )}

      {multiple && (
        <div className="lightbox__count">
          {i + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
