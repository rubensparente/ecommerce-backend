const formatProductResponse = (product, fields = null) => {
  const plain = product.get({ plain: true });

  const formatted = {
    id: plain.id,
    enabled: plain.enabled,
    name: plain.name,
    slug: plain.slug,
    stock: plain.stock,
    description: plain.description,
    price: plain.price,
    price_with_discount: plain.price_with_discount,
    category_ids: plain.categories ? plain.categories.map((c) => c.id) : [],
    images: plain.images
      ? plain.images.map((img) => ({ id: img.id, content: img.path }))
      : [],
    options: plain.options || [],
  };

  if (!fields) return formatted;

  const allowed = fields.split(',').map((f) => f.trim());
  const filtered = {};
  for (const key of allowed) {
    if (key in formatted) filtered[key] = formatted[key];
  }
  return filtered;
};

const parseRadius = (radius) => {
  if (radius === undefined || radius === null) return 0;
  if (typeof radius === 'number') return radius;
  const parsed = parseInt(String(radius).replace(/\D/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const parseOptionValues = (opt) => {
  const raw = opt.values || opt.value;
  if (Array.isArray(raw)) return raw.join(',');
  return raw || '';
};

module.exports = { formatProductResponse, parseRadius, parseOptionValues };