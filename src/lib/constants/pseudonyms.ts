const ADJECTIVES = [
  'Tall', 'Cedar', 'Aspen', 'Birch', 'Elm', 'Oak', 'Maple', 'Willow',
  'Ridge', 'Peak', 'Summit', 'Crest', 'Stone', 'River', 'Lake', 'Field',
  'Swift', 'Calm', 'Bold', 'Clear', 'Deep', 'Bright', 'Steady', 'Wide',
  'North', 'West', 'East', 'South', 'High', 'Far', 'Lone', 'Open',
]

const NOUNS = [
  'Oak', 'Pine', 'Cedar', 'Ridge', 'Peak', 'Creek', 'Trail', 'Grove',
  'Stone', 'River', 'Lake', 'Field', 'Cliff', 'Mesa', 'Point', 'Cove',
  'Star', 'Moon', 'Sky', 'Wind', 'Fire', 'Rain', 'Wave', 'Tide',
  'Road', 'Path', 'Bridge', 'Gate', 'Hill', 'Vale', 'Glen', 'Moor',
]

export function generatePseudonyms(count = 3): string[] {
  const results: string[] = []
  const used = new Set<string>()
  while (results.length < count) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    const num = Math.floor(Math.random() * 90) + 10
    const candidate = `${adj}${noun}${num}`
    if (!used.has(candidate)) {
      used.add(candidate)
      results.push(candidate)
    }
  }
  return results
}

export function validatePseudonym(value: string): string | null {
  if (value.length < 3) return 'Too short. Minimum 3 characters.'
  if (value.length > 20) return 'Too long. Maximum 20 characters.'
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Only letters, numbers, hyphens, and underscores.'
  return null
}
