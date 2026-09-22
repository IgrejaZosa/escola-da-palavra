export function StatCard({
  label,
  value,
  caption,
  emoji,
}: {
  label: string;
  value: string | number;
  caption?: string;
  emoji?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-zosa-muted flex items-center gap-1">
        {emoji && <span>{emoji}</span>}
        {label}
      </p>
      <p className="text-2xl font-bold text-zosa-ink mt-1">{value}</p>
      {caption && <p className="text-xs text-zosa-muted mt-0.5">{caption}</p>}
    </div>
  );
}
