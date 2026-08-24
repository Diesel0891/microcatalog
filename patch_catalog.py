with open('src/pages/Catalog.jsx', 'r') as f:
    lines = f.readlines()

# Replace line 18 (index 17): VIRAL_BANNER_INTERVAL
lines[17] = "const VIRAL_BANNER_POSITIONS = [6, 18]\nconst VIRAL_BANNER_MAX_IMPRESSIONS = 2\n"

# Replace line 111 (index 110): dismissedBanners state
lines[110] = """  const [viralImpressions, setViralImpressions] = useState(() => {
    try {
      const saved = sessionStorage.getItem('infini_viral_impressions')
      const parsed = saved ? parseInt(saved, 10) : 0
      return Number.isNaN(parsed) ? 0 : parsed
    } catch {
      return 0
    }
  })
"""

# Delete lines 510-518 (indices 509-517) — the old viral banner block
# and insert new block
new_block = """          // Viral CTA interstitial
          const position = index + 1
          const shouldShowViral = VIRAL_BANNER_POSITIONS.includes(position) && viralImpressions < VIRAL_BANNER_MAX_IMPRESSIONS
          if (shouldShowViral) {
            cards.push(
              <CatalogViralBanner
                key={`viral-${position}`}
                onImpression={() => {
                  setViralImpressions((prev) => {
                    const next = prev + 1
                    try { sessionStorage.setItem('infini_viral_impressions', String(next)) } catch {}
                    return next
                  })
                }}
              />,
            )
          }
"""
lines = lines[:509] + [new_block] + lines[518:]

with open('src/pages/Catalog.jsx', 'w') as f:
    f.writelines(lines)

print('Done')
