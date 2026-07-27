export function Skel({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lh bg-sand-line/40 ${className}`} />
  );
}
