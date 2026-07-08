import { useState } from 'react';
import type { DiscoverQuestion } from '../types';
import type { QuizAnswer } from '../lib/progress';

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/**
 * Quiz d'un élément à découvrir : QCM (boutons) ou champ libre. Compare la
 * réponse de façon tolérante (casse et accents ignorés).
 */
export function Quiz({
  question,
  saved,
  onAnswer,
}: {
  question: DiscoverQuestion;
  saved?: QuizAnswer;
  onAnswer: (answer: string, isCorrect: boolean) => void;
}) {
  const [value, setValue] = useState(saved?.answer ?? '');

  const submit = (answer: string) => {
    const isCorrect = question.answers.some((a) => normalize(a) === normalize(answer));
    onAnswer(answer, isCorrect);
  };

  const isCorrect = saved?.isCorrect ?? false;
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="quiz">
      <p className="quiz__label">{question.label}</p>

      {question.hint && !isCorrect && (
        <>
          <button type="button" className="link-btn" onClick={() => setShowHint((v) => !v)}>
            {showHint ? 'Masquer l’indice' : '💡 Besoin d’un indice ?'}
          </button>
          {showHint && <p className="quiz__hint">{question.hint}</p>}
        </>
      )}

      {question.type === 'qcm' && question.choices ? (
        <div className="quiz__choices">
          {question.choices.map((choice) => {
            const chosen = saved?.answer === choice;
            const cls = chosen ? (isCorrect ? 'choice choice--ok' : 'choice choice--ko') : 'choice';
            return (
              <button key={choice} className={cls} onClick={() => submit(choice)} disabled={isCorrect}>
                {choice}
              </button>
            );
          })}
        </div>
      ) : (
        <form
          className="quiz__form"
          onSubmit={(e) => {
            e.preventDefault();
            submit(value);
          }}
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Votre réponse…"
            disabled={isCorrect}
            aria-label="Votre réponse"
          />
          <button type="submit" disabled={isCorrect || !value.trim()}>
            Valider
          </button>
        </form>
      )}

      {saved && (
        <p className={`quiz__result ${isCorrect ? 'ok' : 'ko'}`}>
          {isCorrect ? '✅ Bonne réponse !' : '❌ Pas encore, réessayez.'}
        </p>
      )}
      {isCorrect && question.explanation && <p className="quiz__explain">{question.explanation}</p>}
    </div>
  );
}
