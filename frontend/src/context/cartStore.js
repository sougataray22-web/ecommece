import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem('cart') || '[]'),

  _persist: (items) => {
    localStorage.setItem('cart', JSON.stringify(items));
    set({ items });
  },

  addItem: (product, quantity = 1, variationSku = null, attributes = {}) => {
    const items = [...get().items];
    const key   = `${product._id}-${variationSku || 'base'}`;
    const idx   = items.findIndex((i) => i.key === key);

    if (idx > -1) {
      items[idx].quantity += quantity;
    } else {
      const price = variationSku
        ? product.variations?.find((v) => v.sku === variationSku)?.price
        : product.basePrice;

      items.push({
        key,
        productId:    product._id,
        name:         product.name,
        image:        product.images?.[0],
        slug:         product.slug,
        vendorId:     product.vendor?._id || product.vendor,
        vendorName:   product.vendor?.businessName || product.vendor?.name || '',
        variationSku,
        attributes,
        unitPrice:    price,
        quantity,
      });
    }
    get()._persist(items);
  },

  removeItem: (key) => {
    const items = get().items.filter((i) => i.key !== key);
    get()._persist(items);
  },

  updateQty: (key, quantity) => {
    if (quantity < 1) return get().removeItem(key);
    const items = get().items.map((i) => i.key === key ? { ...i, quantity } : i);
    get()._persist(items);
  },

  clearCart: () => {
    localStorage.removeItem('cart');
    set({ items: [] });
  },

  total:     () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
  itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
}));

export default useCartStore;
