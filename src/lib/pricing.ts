export type Tier = { min: number; max: number; price: number; label: string };

/** Bulk pricing, in USD. Unchanged from the original price list. */
export const TIERS: Tier[] = [
  { min: 1, max: 4, price: 22, label: "1 – 4" },
  { min: 5, max: 19, price: 19, label: "5 – 19" },
  { min: 20, max: 49, price: 16, label: "20 – 49" },
  { min: 50, max: 9999, price: 14, label: "50 +" },
];

export const FREE_SHIPPING_OVER = 150;
export const SHIPPING_FEE = 4;
export const MAX_QUANTITY = 500;

export function tierFor(quantity: number): Tier {
  return TIERS.find((tier) => quantity >= tier.min && quantity <= tier.max) ?? TIERS[TIERS.length - 1];
}

export function quote(quantity: number) {
  const clamped = Math.max(1, Math.min(MAX_QUANTITY, Math.floor(quantity) || 1));
  const tier = tierFor(clamped);
  const subtotal = clamped * tier.price;
  const shipping = subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  return { quantity: clamped, tier, subtotal, shipping, total: subtotal + shipping };
}

export function money(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

export function tierNote(tier: Tier): string {
  const range = tier.max > MAX_QUANTITY ? `${tier.min}+ tier` : `${tier.min}–${tier.max} tier`;
  return `$${tier.price} each · ${range}`;
}
