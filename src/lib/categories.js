/**
 * Product category taxonomy for Microcatalog.
 *
 * 14 top-level categories with category-specific specification fields.
 * Backward compatible: existing DB values ("Apparel", "Shoes", "Electronics")
 * map directly to category IDs (which equal display labels).
 *
 * @module categories
 */

/**
 * @typedef {Object} CategoryDef
 * @property {string} id - Stable category identifier (matches DB value)
 * @property {string} label - Human-readable display name
 * @property {string[]} specs - Specification fields shown in the product editor
 */

/** @type {CategoryDef[]} */
export const CATEGORIES = [
  {
    id: 'Apparel',
    label: 'Apparel',
    specs: ['Size', 'Gender/Age Group', 'Color', 'Material'],
  },
  {
    id: 'Shoes',
    label: 'Shoes',
    specs: ['Size', 'Gender/Age Group', 'Color', 'Material'],
  },
  {
    id: 'Electronics',
    label: 'Electronics',
    specs: ['Brand', 'Model', 'Storage', 'RAM', 'Condition'],
  },
  {
    id: 'Phones & Tablets',
    label: 'Phones & Tablets',
    specs: ['Brand', 'Model', 'Storage', 'RAM', 'Screen Size', 'Condition'],
  },
  {
    id: 'Home & Living',
    label: 'Home & Living',
    specs: ['Material', 'Dimensions', 'Color', 'Condition'],
  },
  {
    id: 'Beauty & Personal Care',
    label: 'Beauty & Personal Care',
    specs: ['Brand', 'Size/Volume', 'Skin/Hair Type', 'Product Type'],
  },
  {
    id: 'Health & Wellness',
    label: 'Health & Wellness',
    specs: ['Brand', 'Size/Volume', 'Type', 'Condition'],
  },
  {
    id: 'Baby & Kids',
    label: 'Baby & Kids',
    specs: ['Size', 'Age Group', 'Color', 'Material', 'Condition'],
  },
  {
    id: 'Sports & Outdoors',
    label: 'Sports & Outdoors',
    specs: ['Size', 'Color', 'Material', 'Condition'],
  },
  {
    id: 'Automotive',
    label: 'Automotive',
    specs: ['Make', 'Model', 'Year', 'Part Type', 'Condition'],
  },
  {
    id: 'Tools & Hardware',
    label: 'Tools & Hardware',
    specs: ['Brand', 'Size', 'Material', 'Condition'],
  },
  {
    id: 'Food & Groceries',
    label: 'Food & Groceries',
    specs: ['Brand', 'Quantity/Weight', 'Expiry/Best Before'],
  },
  {
    id: 'Books, Stationery & Office',
    label: 'Books, Stationery & Office',
    specs: ['Brand', 'Type', 'Condition'],
  },
  {
    id: 'Other',
    label: 'Other',
    specs: ['Size / Specs'],
  },
]

/**
 * Lookup a category definition by its ID.
 *
 * @param {string} id
 * @returns {CategoryDef | undefined}
 */
export function getCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id)
}

/**
 * Get the specification fields for a given category ID.
 * Falls back to generic "Size / Specs" for unknown categories.
 *
 * @param {string} [id]
 * @returns {string[]}
 */
export function getCategorySpecs(id) {
  const cat = getCategoryById(id)
  return cat?.specs ?? ['Size / Specs']
}

/**
 * Check if a category ID is valid.
 *
 * @param {string} [id]
 * @returns {boolean}
 */
export function isValidCategory(id) {
  if (!id) return false
  return CATEGORIES.some((c) => c.id === id)
}
