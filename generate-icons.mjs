// generate-icons.mjs — run: node generate-icons.mjs
// Creates icon-192.png and icon-512.png from the SVG using a Canvas approach.
// No extra npm packages needed — uses built-in Node.js only.
// The icons are simple colored squares with emerald background as fallback.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'

// Minimal valid PNG: a 1x1 pixel green PNG (just to avoid broken icon errors)
// Full-quality icons: use https://svgtopng.com with public/icons/icon.svg
// OR run: npm install sharp && node generate-icons.mjs (uncomment sharp code below)

// ─── Option A: Use sharp (best quality) ──────────────────────────────────────
async function withSharp() {
  let sharp
  try { sharp = (await import('sharp')).default } catch { return false }

  const svg = readFileSync('./public/icons/icon.svg')
  if (!existsSync('./public/icons')) mkdirSync('./public/icons', { recursive: true })

  for (const size of [192, 512]) {
    await sharp(svg).resize(size, size).png().toFile(`./public/icons/icon-${size}.png`)
    console.log(`✅ icon-${size}.png`)
  }
  return true
}

// ─── Option B: Write minimal valid 1-pixel black PNG as placeholder ──────────
function writePlaceholder(path, label) {
  // Minimal valid 1x1 black PNG (binary)
  const pngData = Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, // PNG signature
    0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52, // IHDR chunk length + type
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // width=1, height=1
    0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53, // bitdepth=8, colortype=2
    0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41, // IHDR CRC + IDAT chunk
    0x54,0x08,0xD7,0x63,0x10,0xB9,0x81,0x30, // IDAT data (emerald pixel)
    0x06,0x00,0x00,0x13,0x00,0x01,0x4B,0x87,
    0xCF,0xD3,0x00,0x00,0x00,0x00,0x49,0x45, // IEND
    0x4E,0x44,0xAE,0x42,0x60,0x82
  ])
  writeFileSync(path, pngData)
  console.log(`⚠️  Placeholder created: ${label} (convert icon.svg for real icons)`)
}

;(async () => {
  if (!existsSync('./public/icons')) mkdirSync('./public/icons', { recursive: true })
  const ok = await withSharp()
  if (!ok) {
    writePlaceholder('./public/icons/icon-192.png', 'icon-192.png')
    writePlaceholder('./public/icons/icon-512.png', 'icon-512.png')
    console.log('\n👉 For real icons: npm install sharp && node generate-icons.mjs')
    console.log('👉 OR convert public/icons/icon.svg at https://svgtopng.com\n')
  }
})()
