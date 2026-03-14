type Props = {
  title: string;
  description: string;
};

export default function EmptyState({ title, description }: Props) {
  return (
    <div className="empty-state-shell fade-in">
      <div className="empty-state-orb" />
      <div className="empty-state-content">
        <span className="section-kicker">Nothing here yet</span>
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-copy">{description}</p>
      </div>
    </div>
  );
}
