import fs from 'node:fs'
import path from 'node:path'

const src = path.join('node_modules', '@research-ag', 'ic-web-push', 'sw.js')
const dst = path.join('public', 'ic-web-push-sw.js')

try {
  fs.copyFileSync(src, dst)
  console.log('[postinstall] Copied', src, 'to', dst)
} catch (e) {
  throw new Error('[postinstall] Copy failed:', e?.message || e)
}
