import { useState } from 'react';
import type { DiscoverItem, Site } from '../types';
import type { ProgressApi } from '../hooks/useProgress';
import { Quiz } from './Quiz';
import { itemKey } from '../lib/progress';

/**
 * Carte d'un élément "À découvrir" : image, indice de localisation, description
 * (anecdote), quiz optionnel, et la coche "Trouvé / Vu" qui gamifie la visite.
 */
export function DiscoverCard({
  site,
  item,
  api,
}: {
  site: Site;
  item: DiscoverItem;
  api: ProgressApi;
}) {
  const [showHint, setShowHint] = useState(false);
  const found = api.isFound(site.id, item.id);
  const saved = api.progress.quizAnswers[itemKey(site.id, item.id)];

  const images = item.images ?? [];

  return (
    <article className={`discover ${found ? 'discover--found' : ''}`}>
      {images.length > 0 && (
        <div className={images.length > 1 ? 'discover__gallery' : ''}>
          {images.map((img, i) => (
            <figure className="discover__figure" key={img.src + i}>
              <img src={img.src} alt={img.caption ?? item.title} loading="lazy" />
              {img.caption && <figcaption>{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      <div className="discover__body">
        <div className="discover__head">
          <h4>{item.title}</h4>
          {found && <span className="badge-found">Trouvé !</span>}
        </div>
        <p className="discover__desc">{item.description}</p>

        {item.locationHint && (
          <>
            <button className="link-btn" onClick={() => setShowHint((v) => !v)}>
              {showHint ? 'Masquer l’indice' : 'Où le trouver ?'}
            </button>
            {showHint && <p className="discover__hint">📍 {item.locationHint}</p>}
          </>
        )}

        {item.question && (
          <Quiz
            question={item.question}
            saved={saved}
            onAnswer={(answer, ok) => {
              api.saveQuizAnswer(site.id, item.id, answer, ok);
              if (ok && !found) api.toggleItemFound(site.id, item.id);
            }}
          />
        )}

        <button
          className={`found-btn ${found ? 'found-btn--on' : ''}`}
          onClick={() => api.toggleItemFound(site.id, item.id)}
        >
          {found ? '✓ Marqué' : item.question ? 'Je l’ai trouvé !' : 'Je l’ai vu !'}
        </button>
      </div>
    </article>
  );
}
