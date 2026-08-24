with open('src/pages/Catalog.jsx', 'r') as f:
    lines = f.readlines()

# 1. Replace line 18 (index 17)
lines[17] = "const VIRAL_BANNER_POSITIONS = [6, 18]\n"
lines.insert(18, "const VIRAL_BANNER_MAX_IMPRESSIONS = 2\n")

# 2. Replace line 111 (index 110) — now shifted by +1 due to insert above, so index 111
lines[111] = """  const [viralImpressions, setViralImpressions] = useState(() => {
    try {
      const saved = sessionStorage.getItem('infini_viral_impressions')
      const parsed = saved ? parseInt(saved, 10) : 0
      return Number.isNaN(parsed) ? 0 : parsed
    } catch {
      return 0
    }
  })
"""

# 3. Find and replace the viral banner block
# After the insert above, line numbers shifted by +1
# Original lines 500-509 are now 501-510
start = None
end = None
for i in range(500, 520):
    if i < len(lines) and '// Viral banner every 6 products' in lines[i]:
        start = i
    if start is not None and i < len(lines) and 'return cards' in lines[i]:
        end = i
        break

if start is not None and end is not None:
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
    lines = lines[:start] + [new_block] + lines[end:]

with open('src/pages/Catalog.jsx', 'w') as f:
    f.writelines(lines)

print('Done')
