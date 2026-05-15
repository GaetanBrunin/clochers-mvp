import { Camera, Check, CheckCircle2, Heart, MapPin, RotateCcw, Save, ScrollText } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Church, PersonalChurchState } from '../types/domain';

type ChurchSheetProps = {
  church: Church;
  state: PersonalChurchState;
  onToggleVisited: () => void;
  onToggleFavorite: () => void;
  onSaveNote: (note: string) => void;
  onCompleteChallenge: (challengeId: string) => void;
  onResetChallenge: (challengeId: string) => void;
};

export function ChurchSheet({
  church,
  state,
  onToggleVisited,
  onToggleFavorite,
  onSaveNote,
  onCompleteChallenge,
  onResetChallenge
}: ChurchSheetProps) {
  const [note, setNote] = useState(state.personalNote ?? '');

  useEffect(() => {
    setNote(state.personalNote ?? '');
  }, [church.id, state.personalNote]);

  const completedCount = Object.keys(state.completedChallenges).length;
  const percent = church.challenges.length === 0 ? 0 : Math.round((completedCount / church.challenges.length) * 100);

  return (
    <article className="church-sheet">
      <div className="image-wrap">
        <img src={church.heroImage} alt={church.name} />
        <button className={`favorite-button ${state.favorite ? 'active' : ''}`} onClick={onToggleFavorite} type="button" aria-label="Ajouter aux favoris">
          <Heart size={19} fill={state.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="sheet-content">
        <div className="title-row">
          <div>
            <span className="location"><MapPin size={14} /> {church.city}</span>
            <h2>{church.name}</h2>
          </div>
          <button className={`visit-button ${state.visited ? 'done' : ''}`} onClick={onToggleVisited} type="button">
            {state.visited ? <CheckCircle2 size={17} /> : <Check size={17} />}
            {state.visited ? 'Visitée' : 'Marquer'}
          </button>
        </div>

        <p className="description">{church.shortDescription}</p>

        <div className="tags">
          {church.tags.map((tag) => <span key={tag}>#{tag}</span>)}
        </div>

        <section className="info-box">
          <h3><ScrollText size={17} /> Anecdote à découvrir</h3>
          <p>{church.anecdote}</p>
        </section>

        <section className="progress-box">
          <div className="progress-header">
            <strong>Chasse aux détails</strong>
            <span>{completedCount}/{church.challenges.length} • {percent}%</span>
          </div>
          <div className="progress-bar"><span style={{ width: `${percent}%` }} /></div>
        </section>

        <section className="challenge-list">
          {church.challenges.map((challenge) => {
            const isDone = Boolean(state.completedChallenges[challenge.id]);
            return (
              <div className={`challenge ${isDone ? 'done' : ''}`} key={challenge.id}>
                <div className="challenge-icon">
                  {challenge.type === 'photo' ? <Camera size={17} /> : <ScrollText size={17} />}
                </div>
                <div className="challenge-body">
                  <h4>{challenge.title}</h4>
                  <p>{challenge.description}</p>
                  {challenge.hint ? <details><summary>Indice</summary>{challenge.hint}</details> : null}
                  {challenge.question ? <small className="question">Question : {challenge.question}</small> : null}
                  <button
                    className={isDone ? 'secondary-action' : 'primary-action'}
                    onClick={() => isDone ? onResetChallenge(challenge.id) : onCompleteChallenge(challenge.id)}
                    type="button"
                  >
                    {isDone ? <RotateCcw size={15} /> : <Check size={15} />}
                    {isDone ? 'Annuler' : 'Défi réussi'}
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        <section className="note-box">
          <label htmlFor="personal-note">Mon anecdote perso</label>
          <textarea
            id="personal-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ex : j’ai remarqué une petite inscription près d’un vitrail..."
            rows={4}
          />
          <button className="primary-action" onClick={() => onSaveNote(note)} type="button">
            <Save size={15} /> Enregistrer sur ce téléphone
          </button>
        </section>
      </div>
    </article>
  );
}
