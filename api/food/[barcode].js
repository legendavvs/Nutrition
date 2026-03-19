// api/food/[barcode].js — Vercel Serverless Function
// Proxies Open Food Facts API to avoid CORS issues in the browser

export default async function handler(req, res) {
  const { barcode } = req.query

  if (!barcode) {
    return res.status(400).json({ error: 'Barcode is required' })
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: { 'User-Agent': 'NutriScan/1.0 (contact@nutriscan.app)' },
        signal: AbortSignal.timeout(8000),
      }
    )

    const data = await response.json()

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
}
