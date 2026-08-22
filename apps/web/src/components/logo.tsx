export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="14" fill="#16171a" stroke="#c8f751" strokeWidth="1.5" />
      <path d="M2 16a14 14 0 0 1 14-14v28A14 14 0 0 1 2 16Z" fill="#c8f751" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="text-base font-semibold tracking-tight text-bone">KAPSÜL</span>
    </div>
  );
}
