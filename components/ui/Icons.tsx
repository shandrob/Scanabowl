/** Small inline icons (no icon library needed). All decorative unless given a title. */
type P = { className?: string };
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const IconSearch = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const IconBarcode = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14M21 5v14" strokeWidth="1.6" />
  </svg>
);
export const IconCheck = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);
export const IconX = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconAlert = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3 2 20h20L12 3z" />
    <path d="M12 10v4M12 17.5v.01" />
  </svg>
);
export const IconInfo = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8v.01" />
  </svg>
);
export const IconPaw = ({ className }: P) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden className={className}>
    <ellipse cx="6" cy="10" rx="2.1" ry="2.8" />
    <ellipse cx="10.5" cy="6" rx="2.1" ry="2.8" />
    <ellipse cx="15.5" cy="6" rx="2.1" ry="2.8" />
    <ellipse cx="19.5" cy="10" rx="2.1" ry="2.8" />
    <path d="M12.5 11c-3 0-6 3.4-6 6 0 1.6 1.2 2.6 2.7 2.6 1.3 0 2-.6 3.3-.6s2 .6 3.3.6c1.5 0 2.7-1 2.7-2.6 0-2.6-3-6-6-6z" />
  </svg>
);
export const IconChevron = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const IconExternal = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);
export const IconArrow = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconMenu = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconGlobe = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
  </svg>
);
export const IconLeaf = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15" />
    <path d="M5 19c3-5 6-7 10-9" />
  </svg>
);
export const IconShield = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
