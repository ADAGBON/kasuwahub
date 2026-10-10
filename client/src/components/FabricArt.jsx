import { useId } from 'react'

// Generated, original fabric artwork so the UI works before real product
// photos are uploaded to Cloudinary in Phase 2.
function Pattern({ type, a, b, c, id }) {
  switch (type) {
    case 'circles':
      return (
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill={c} />
          <circle cx="20" cy="20" r="14" fill={a} />
          <circle cx="20" cy="20" r="8" fill={b} />
          <circle cx="20" cy="20" r="3" fill={c} />
          <circle cx="0" cy="0" r="5" fill={b} /><circle cx="40" cy="0" r="5" fill={b} />
          <circle cx="0" cy="40" r="5" fill={b} /><circle cx="40" cy="40" r="5" fill={b} />
        </pattern>
      )
    case 'diamonds':
      return (
        <pattern id={id} width="36" height="36" patternUnits="userSpaceOnUse">
          <rect width="36" height="36" fill={a} />
          <path d="M18 2 L34 18 L18 34 L2 18 Z" fill={b} />
          <path d="M18 10 L26 18 L18 26 L10 18 Z" fill={c} />
          <circle cx="18" cy="18" r="2.5" fill={a} />
        </pattern>
      )
    case 'waves':
      return (
        <pattern id={id} width="48" height="24" patternUnits="userSpaceOnUse">
          <rect width="48" height="24" fill={c} />
          <path d="M0 12 Q12 0 24 12 T48 12" stroke={a} strokeWidth="6" fill="none" />
          <path d="M0 22 Q12 10 24 22 T48 22" stroke={b} strokeWidth="3" fill="none" />
        </pattern>
      )
    case 'stripes':
      return (
        <pattern id={id} width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill={a} />
          <rect x="0" width="4" height="30" fill={b} />
          <rect x="10" width="2" height="30" fill={c} />
          <rect x="16" width="6" height="30" fill={c} opacity=".55" />
          <rect x="25" width="1.5" height="30" fill={b} />
        </pattern>
      )
    case 'lace':
      return (
        <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill={a} />
          <circle cx="14" cy="14" r="9" fill="none" stroke={b} strokeWidth="1.5" />
          <circle cx="14" cy="14" r="4" fill="none" stroke={b} strokeWidth="1" />
          <circle cx="0" cy="0" r="4" fill="none" stroke={b} strokeWidth="1" />
          <circle cx="28" cy="28" r="4" fill="none" stroke={b} strokeWidth="1" />
          <circle cx="14" cy="5" r="1.2" fill={c} /><circle cx="14" cy="23" r="1.2" fill={c} />
          <circle cx="5" cy="14" r="1.2" fill={c} /><circle cx="23" cy="14" r="1.2" fill={c} />
        </pattern>
      )
    case 'adire':
      return (
        <pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse">
          <rect width="44" height="44" fill={a} />
          <path d="M22 8 a14 14 0 1 1 -0.1 0 M22 14 a8 8 0 1 1 -0.1 0" stroke={b} strokeWidth="2" fill="none" strokeDasharray="4 3" />
          <circle cx="22" cy="22" r="2.5" fill={b} />
          <path d="M0 0 L8 8 M44 0 L36 8 M0 44 L8 36 M44 44 L36 36" stroke={b} strokeWidth="1.5" />
        </pattern>
      )
    case 'beads':
      return (
        <pattern id={id} width="22" height="22" patternUnits="userSpaceOnUse">
          <rect width="22" height="22" fill={c} />
          <circle cx="11" cy="11" r="7" fill={a} />
          <circle cx="9" cy="9" r="2" fill={c} opacity=".6" />
          <circle cx="0" cy="0" r="3" fill={b} /><circle cx="22" cy="22" r="3" fill={b} />
          <circle cx="22" cy="0" r="3" fill={b} /><circle cx="0" cy="22" r="3" fill={b} />
        </pattern>
      )
    default: // plain woven
      return (
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill={a} />
          <path d="M0 6 L6 0" stroke={c} strokeWidth=".8" opacity=".6" />
        </pattern>
      )
  }
}

const garments = {
  kaftan: 'M70 20 L90 14 Q100 26 110 14 L130 20 L160 50 L145 66 L132 56 L132 180 L68 180 L68 56 L55 66 L40 50 Z',
  dress: 'M80 18 Q100 30 120 18 L128 24 L122 70 Q150 130 162 180 L38 180 Q50 130 78 70 L72 24 Z',
}

export default function FabricArt({ product, className = '' }) {
  const uid = useId().replace(/:/g, '')
  const photo = product.images?.[0]?.url || product.image
  if (photo) return <img src={photo} alt={product.name} loading="lazy" className={`object-cover ${className}`} />
  const [a, b, c] = product.palette?.length ? product.palette : ['#1f2a5c', '#e8a33d', '#faf5ec']
  const patternId = `p-${uid}`
  const shadeId = `s-${uid}`
  const garment = garments[product.garment]

  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={product.name}>
      <defs>
        <Pattern type={product.pattern} a={a} b={b} c={c} id={patternId} />
      </defs>
      {garment ? (
        <>
          <rect width="200" height="200" fill="#efe6d6" />
          <ellipse cx="100" cy="186" rx="70" ry="6" fill="#000" opacity=".08" />
          <path d={garment} fill={`url(#${patternId})`} stroke="#0002" strokeWidth="1.5" />
          <path d={garment} fill={`url(#${shadeId})`} opacity=".25" />
          <linearGradient id={shadeId} x1="0" x2="1">
            <stop offset="0" stopColor="#000" stopOpacity=".25" /><stop offset=".5" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".2" />
          </linearGradient>
        </>
      ) : (
        <>
          <rect width="200" height="200" fill={`url(#${patternId})`} />
          {/* folded-fabric shading */}
          <path d="M0 140 Q100 115 200 140 L200 200 L0 200 Z" fill="#000" opacity=".12" />
          <path d="M0 140 Q100 115 200 140" stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" />
        </>
      )}
    </svg>
  )
}
