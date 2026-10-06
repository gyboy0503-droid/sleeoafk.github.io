const paths = {
  'arrow-up-right': <path d="M6 18 18 6M6 6h12v12" />,
  'arrow-right': <path d="M4 12h15m-6-6 6 6-6 6" />,
  'arrow-down': <path d="M12 4v16m-6-6 6 6 6-6" />,
  target: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /><circle cx="12" cy="12" r="4" /><path d="M12 6v2m0 8v2m-6-6h2m8 0h2" /></>,
  pause: <path d="M8 5v14M16 5v14" />,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  spark: <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />,
  book: <path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  gift: <><path d="M3 9h18v5H3zM5 14v7h14v-7M12 9v12" /><path d="M12 9H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z" /></>,
}
export default function Icon({ name, className = '' }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name] ?? paths['arrow-right']}</svg>
}
