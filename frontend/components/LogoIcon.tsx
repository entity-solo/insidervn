export default function LogoIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer ring — subtle depth */}
      <circle cx="14" cy="14" r="13" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.25" />
      {/* Inner fill */}
      <circle cx="14" cy="14" r="11.5" fill="var(--surface-2)" />
      {/* Upward chevron — growth / "V" for Vietnam */}
      <path
        d="M8 17.5L14 9.5L20 17.5"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Insight dot — the "insider" eye */}
      <circle cx="14" cy="8.2" r="1.6" fill="var(--accent)" />
    </svg>
  );
}
