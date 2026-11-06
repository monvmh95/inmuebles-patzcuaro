// Ilustraciones originales (formas simples inspiradas en portales, tejas y lago). Sin fotos de terceros.

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M2 14 16 4l14 10z" fill="var(--brand)" />
      <path d="M5 14h22v14H5z" fill="var(--logo-wall, #fffdf8)" stroke="var(--brand)" strokeWidth="1.5" />
      <path d="M11 28V20a5 5 0 0 1 10 0v8z" fill="var(--brand-dark)" />
    </svg>
  );
}

/** Portada: tres portales frente al lago, con tejas y montañas. */
export function PortalesHero({ lang = "es" }: { lang?: "es" | "en" }) {
  return (
    <svg viewBox="0 0 400 480" role="img" aria-label={lang === "en" ? "Illustration of tiled arcades in front of the lake and the mountains" : "Ilustración de portales con tejas frente al lago y las montañas"} preserveAspectRatio="xMidYMid slice" className="art-svg">
      <defs>
        <clipPath id="arch-clip"><path d="M0 480V200a200 200 0 0 1 400 0V480z" /></clipPath>
        <pattern id="tiles" width="26" height="16" patternUnits="userSpaceOnUse">
          <rect width="26" height="16" fill="#9c3a22" />
          <path d="M0 0a13 13 0 0 0 26 0" fill="#b4492c" stroke="#7a2b18" strokeWidth="1" />
          <path d="M-13 8a13 13 0 0 0 26 0M13 8a13 13 0 0 0 26 0" fill="#a53f26" stroke="#7a2b18" strokeWidth="1" />
        </pattern>
      </defs>
      <g clipPath="url(#arch-clip)">
        <rect width="400" height="480" fill="#f4dcae" />
        <circle cx="288" cy="120" r="44" fill="#e9a43c" />
        <path d="M0 250 70 186l62 50 72-76 84 82 52-42 60 54v60H0z" fill="#3d6a5a" />
        <path d="M0 270 90 220l80 40 90-46 140 62v34H0z" fill="#5a8a75" />
        <rect y="282" width="400" height="74" fill="#2f5d50" />
        <g stroke="#cfe3da" strokeWidth="2" strokeLinecap="round" opacity=".55" fill="none">
          <path d="M20 300q12-6 24 0t24 0M150 312q12-6 24 0t24 0M290 298q12-6 24 0t24 0" />
          <path d="M70 332q12-6 24 0t24 0M220 336q12-6 24 0t24 0" />
        </g>
        <rect y="340" width="400" height="140" fill="#fbf4e6" />
        <rect y="318" width="400" height="30" fill="url(#tiles)" />
        <rect y="344" width="400" height="6" fill="#7a2b18" />
        <g fill="#6b2616">
          <path d="M34 480V420a34 34 0 0 1 68 0v60z" />
          <path d="M166 480V420a34 34 0 0 1 68 0v60z" />
          <path d="M298 480V420a34 34 0 0 1 68 0v60z" />
        </g>
        <g fill="#e8d8b8">
          <rect x="108" y="372" width="12" height="108" rx="2" />
          <rect x="240" y="372" width="12" height="108" rx="2" />
          <rect x="372" y="372" width="12" height="108" rx="2" />
          <rect x="-4" y="372" width="12" height="108" rx="2" />
        </g>
        <rect y="466" width="400" height="14" fill="#9c3a22" />
      </g>
    </svg>
  );
}

/** Imagen de respaldo para anuncios sin foto. */
export function PlaceholderArt({ label, lang = "es" }: { label?: string; lang?: "es" | "en" }) {
  const none = lang === "en" ? "No photo" : "Sin foto";
  return (
    <div className="placeholder-art" role="img" aria-label={label ? `${none}: ${label}` : none}>
      <svg viewBox="0 0 200 150" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
        <rect width="200" height="150" fill="#efe3cc" />
        <path d="M0 96 50 62l40 30 46-40 64 46v56H0z" fill="#d9c7a3" />
        <path d="M60 150v-34a22 22 0 0 1 44 0v34z" fill="#b97a5f" opacity=".55" />
        <path d="M40 78 82 52l42 26z" fill="#a8452c" opacity=".6" />
      </svg>
      <span>{label ?? none}</span>
    </div>
  );
}

export function VerifiedIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <path d="m5.5 10.3 3 3 6-6.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
