export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase tracking-widest text-gray-400 font-medium">Loading…</span>
      </div>
    </div>
  );
}
