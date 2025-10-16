# Server-Side Props Error Handling - Fixed

## Problem

All `getServerSideProps` functions were returning `{ props: { error: ... }}` on failure, but components expected specific data structures. This caused crashes with errors like:

```
TypeError: undefined is not an object (evaluating 'e.stock.price')
```

## Solution

Updated all 11 `getServerSideProps` functions to return proper default values that match the component's expected data structure, preventing crashes.

## Files Fixed

### 1. `/pages/index.js`

**Expected:** `{ stock: { price: { total: number }}, borden: { price: { total: number }}}`
**Fixed:** Returns `{ stock: { price: { total: 0 }}, borden: { price: { total: 0 }}}` on error

### 2. `/pages/stock/index.js`

**Expected:** `{ collections: array }`
**Fixed:** Returns `{ collections: [] }` on error

### 3. `/pages/borden/index.js`

**Expected:** `{ collections: array }`
**Fixed:** Returns `{ collections: [] }` on error

### 4. `/pages/products/stock/[slug].js`

**Expected:** `{ products: array, slug: string }`
**Fixed:** Returns `{ products: [], slug: query.slug || 'unknown' }` on error

### 5. `/pages/products/borden/[slug].js`

**Expected:** `{ products: array, slug: string }`
**Fixed:** Returns `{ products: [], slug: query.slug || 'unknown' }` on error

### 6. `/pages/product/stock/[slug].js`

**Expected:** `{ product: object }`
**Fixed:** Returns `{ product: null }` on error

### 7. `/pages/product/borden/[slug].js`

**Expected:** `{ product: object }`
**Fixed:** Returns `{ product: null }` on error

### 8. `/pages/stock-aanvullen.js`

**Expected:** `{ collections: array, products: array }`
**Fixed:** Returns `{ collections: [], products: [] }` on error

### 9. `/pages/borden-aanvullen.js`

**Expected:** `{ collections: array, products: array }`
**Fixed:** Returns `{ collections: [], products: [] }` on error

### 10. `/pages/order.js`

**Expected:** `{}` (empty props)
**Fixed:** Returns `{}` on error

## Benefits

✅ **No More Crashes** - App handles errors gracefully
✅ **Better Logging** - All errors now logged with `console.error()` with context
✅ **User Experience** - Pages show empty states instead of crashing
✅ **Debugging** - Error messages in console help identify issues faster

## Error Handling Pattern

```javascript
export async function getServerSideProps({ query }) {
  try {
    // ... database logic
    return {
      props: {
        /* expected data structure */
      },
    };
  } catch (e) {
    console.error("Error in getServerSideProps (page-name):", e);
    // Return matching data structure with safe defaults
    return {
      props: {
        /* same structure with empty/default values */
      },
    };
  }
}
```

## Testing

All pages will now:

- Show empty lists when database is unavailable
- Display "Geen producten gevonden" instead of crashing
- Allow users to add new items even when collections are empty
- Log errors to console for debugging

## Next Steps (Optional Future Improvements)

1. Add error state UI components (e.g., "Database connection failed")
2. Implement retry logic for failed database queries
3. Add toast notifications for error states
4. Create custom error pages for specific error types
