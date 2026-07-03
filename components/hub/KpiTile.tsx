export function KpiTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-dark-navy text-white p-5 flex items-center gap-4 shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
        <span className="text-white/80">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
        <p className="text-sm text-white/60">{label}</p>
      </div>
    </div>
  );
}
