import { Compass, Sparkles } from 'lucide-react';

type HeaderProps = {
  totalChurches: number;
  stats: {
    visitedCount: number;
    completedChallengeCount: number;
  };
};

export function Header({ totalChurches, stats }: HeaderProps) {
  return (
    <header className="hero">
      <div>
        <p className="eyebrow"><Sparkles size={14} /> MVP mobile</p>
        <h1>Clochers à explorer</h1>
        <p className="hero-text">Une chasse aux détails dans les églises du diocèse de Cambrai.</p>
      </div>
      <div className="score-card">
        <Compass size={18} />
        <strong>{stats.visitedCount}/{totalChurches}</strong>
        <span>visitées</span>
        <small>{stats.completedChallengeCount} défis relevés</small>
      </div>
    </header>
  );
}
