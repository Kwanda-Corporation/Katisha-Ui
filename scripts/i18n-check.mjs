// i18n key-parity checker.
// Ensures every locale exposes the exact same set of leaf keys as the reference
// locale (default: en). Exits non-zero on any mismatch so CI can gate on it.
//
// Usage: node scripts/i18n-check.mjs [referenceLocale]
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const localesDir = join(__dirname, '..', 'locales')
const reference = process.argv[2] || 'en'

function flatten(obj, prefix = '') {
  const keys = []
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) keys.push(...flatten(v, full))
    else keys.push(full)
  }
  return keys
}

const locales = readdirSync(localesDir).filter((d) => {
  try { return statSync(join(localesDir, d)).isDirectory() } catch { return false }
})

const data = {}
for (const loc of locales) {
  const file = join(localesDir, loc, 'translation.json')
  data[loc] = flatten(JSON.parse(readFileSync(file, 'utf8')))
}

if (!data[reference]) {
  console.error(`Reference locale "${reference}" not found. Available: ${locales.join(', ')}`)
  process.exit(2)
}

const refSet = new Set(data[reference])
let failed = false

for (const loc of locales) {
  if (loc === reference) continue
  const set = new Set(data[loc])
  const missing = [...refSet].filter((k) => !set.has(k))
  const extra = [...set].filter((k) => !refSet.has(k))
  if (missing.length || extra.length) {
    failed = true
    console.error(`\n[${loc}]`)
    if (missing.length) console.error(`  missing (${missing.length}): ${missing.slice(0, 40).join(', ')}${missing.length > 40 ? ' …' : ''}`)
    if (extra.length) console.error(`  extra   (${extra.length}): ${extra.slice(0, 40).join(', ')}${extra.length > 40 ? ' …' : ''}`)
  } else {
    console.log(`[${loc}] OK (${set.size} keys)`)
  }
}

if (failed) {
  console.error('\ni18n key parity check FAILED')
  process.exit(1)
}
console.log(`\ni18n key parity OK across ${locales.length} locales (${refSet.size} keys each)`)
