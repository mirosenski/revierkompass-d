import React, { ReactNode, useEffect, useState } from 'react'
import StickyBottomBar from './StickyBottomBar'

interface ModernNavigationProps {
  totalSelected: number
  onContinue: () => void
  children?: ReactNode
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

const ModernNavigation: React.FC<ModernNavigationProps> = ({ totalSelected, onContinue, children }) => {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <>
      {/* Hauptinhalt */}
      <div>{children}</div>

      {/* Sticky Bottom Bar für alle Geräte */}
      {totalSelected > 0 && (
        <StickyBottomBar totalSelected={totalSelected} onContinue={onContinue} disabled={false} />
      )}
    </>
  )
}

export default ModernNavigation
