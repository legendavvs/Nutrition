// api/search.js — Vercel Serverless Function
export default async function handler(req, res) {
  const { q } = req.query

  if (!q) {
    return res.status(400).json({ error: 'Search query is required' })
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=40`,
      {
        headers: { 'User-Agent': 'NutriScan/1.0 (contact@nutriscan.app)' },
        signal: AbortSignal.timeout(10000),
      }
    )

    const data = await response.json()

    if (!data.products) {
      return res.status(200).json({ products: [] })
    }

    const products = data.products
      .filter(p => p.product_name || p.product_name_uk || p.product_name_ru || p.product_name_en || p.generic_name)
      .map(p => {
        const nutriments = p.nutriments || {}
        const productName = p.product_name_uk || p.product_name_ru || p.product_name || p.product_name_en || p.generic_name || 'Unknown product'

        return {
          barcode: p.code || '',
          name: productName,
          brand: p.brands || '',
          per100g: {
            cals: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
            p: Math.round((nutriments['proteins_100g'] || 0) * 10) / 10,
            f: Math.round((nutriments['fat_100g'] || 0) * 10) / 10,
            c: Math.round((nutriments['carbohydrates_100g'] || 0) * 10) / 10,
          },
          image: p.image_small_url || p.image_url || null,
        }
      })

    return res.json({ products })
  } catch (err) {
    console.error('[OFF Search API Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch search data' })
  }
}
