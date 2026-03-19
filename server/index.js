import express from 'express'
import cors from 'cors'
import axios from 'axios'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: '*' }))
app.use(express.json())

// ─── Open Food Facts Proxy ────────────────────────────────────────────────────
app.get('/api/food/:barcode', async (req, res) => {
  const { barcode } = req.params
  try {
    const response = await axios.get(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: { 'User-Agent': 'NutriScan/1.0 (contact@nutriscan.app)' },
        timeout: 8000,
      }
    )

    const data = response.data
    if (data.status !== 1 || !data.product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const p = data.product
    const nutriments = p.nutriments || {}
    
    // Шукаємо назву в різних полях, включаючи українську
    const productName = p.product_name || p.product_name_uk || p.product_name_ru || p.product_name_en || p.generic_name || 'Unknown product'

    const result = {
      name: productName,
      brand: p.brands || '',
      barcode,
      per100g: {
        cals: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
        p: Math.round((nutriments['proteins_100g'] || 0) * 10) / 10,
        f: Math.round((nutriments['fat_100g'] || 0) * 10) / 10,
        c: Math.round((nutriments['carbohydrates_100g'] || 0) * 10) / 10,
      },
      image: p.image_small_url || p.image_url || null,
    }

    return res.json(result)
  } catch (err) {
    console.error('[OFF API Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch product data' })
  }
})

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => console.log(`✅ NutriScan server running on http://localhost:${PORT}`))
