import { CheckCircle2, MapPin } from 'lucide-react';
import type { Church, PersonalChurchState } from '../types/domain';

type ChurchCardProps = {
  church: Church;
  state: PersonalChurchState;
  isSelected: boolean;
  onClick: () => void;
};

export function ChurchCard({ church, state, isSelected, onClick }: ChurchCardProps) {
  const completedCount = Object.keys(state.completedChallenges).length;

  return (
    <button className={`church-card ${isSelected ? 'selected' : ''}`} onClick={onClick} type="button">
      <img src={church.heroImage} alt="" />
      <span className="church-card-city"><MapPin size={13} /> {church.city}</span>
      <strong>{church.name}</strong>
      <span className="progress-pill">
        {state.visited ? <CheckCircle2 size={14} /> : null}
        {completedCount}/{church.challenges.length} défis
      </span>
    </button>
  );
}
