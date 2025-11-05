// Default prices per square meter for collections
// Update these values when prices change

export const COLLECTION_DEFAULTS = {
  // Borden collections
  'forex_zwart': {
    price_per_square_meter: 4.76,
    calculation_type: 'bord'
  },
  'forex_wit': {
    price_per_square_meter: 6.08,
    calculation_type: 'bord'
  },
  // Add more collections here as needed
  // 'collection_name': {
  //   price_per_square_meter: 0.00,
  //   calculation_type: 'bord'
  // }
};

// Get default price for a collection
export function getCollectionDefaults(collectionName) {
  const normalized = collectionName?.toLowerCase().trim();
  return COLLECTION_DEFAULTS[normalized] || {
    price_per_square_meter: 0,
    calculation_type: 'bord'
  };
}
