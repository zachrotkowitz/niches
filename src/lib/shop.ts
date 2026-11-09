// Shop ("Etsy meets Pinterest"): people sell cookbooks, recipe collections,
// prints and artwork. Demo only: checkout charges nothing. No food sales.

import type { NicheId } from './theme';

/** Niches with a shop. */
export const SHOP_NICHES: NicheId[] = ['cooking', 'art', 'photography'];

/** Niches' fee, paid by the seller out of each sale (buyers pay no extra fees). */
export const FEE_RATE = 0.05;

export type ListingFormat = 'physical' | 'digital';

export type Listing = {
  id: string;
  sellerId: string;
  niche: NicheId;
  title: string;
  description: string;
  category: string;
  format: ListingFormat;
  priceCents: number;
  /** Physical only. */
  shippingCents?: number;
  /** Physical only; undefined means made to order. */
  stock?: number;
  /** A post that shows this listing under it ("Shop this"). */
  linkedPostId?: string;
  mediaColor: string;
  mediaLabel: string;
  /** A real product photo, when one was picked. */
  imageUri?: string;
  createdAt: number;
  sold: number;
};

export type CartItem = { listingId: string; qty: number };

export type OrderStatus = 'paid' | 'shipped' | 'delivered' | 'ready';

export type OrderLine = { listingId: string; title: string; priceCents: number; qty: number; format: ListingFormat };

export type Order = {
  id: string;
  buyerId: string;
  sellerId: string;
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  /** Niches' fee, taken from the seller's side. */
  feeCents: number;
  status: OrderStatus;
  shipTo?: string;
  createdAt: number;
};

export const CATEGORIES: Partial<Record<NicheId, string[]>> = {
  cooking: ['Cookbook', 'Recipe collection', 'Kitchen print', 'Zine'],
  art: ['Original artwork', 'Print', 'Zine', 'Stickers'],
  photography: ['Print', 'Photo book', 'Presets'],
};

export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export function feeFor(subtotalCents: number): number {
  return Math.round(subtotalCents * FEE_RATE);
}

export function formatLine(l: Pick<Listing, 'format' | 'shippingCents'>): string {
  if (l.format === 'digital') return 'Instant download';
  return l.shippingCents ? `Ships in 3–5 days · ${formatPrice(l.shippingCents)} shipping` : 'Ships in 3–5 days · free shipping';
}

export function statusLabel(o: Pick<Order, 'status'>): string {
  return { paid: 'Paid · waiting to ship', shipped: 'Shipped', delivered: 'Delivered', ready: 'Ready to download' }[o.status];
}

const H = 3600 * 1000;
const D = 24 * H;

export function seedListings(now: number): Listing[] {
  return [
    // Cooking
    { id: 'l_pasta_notes', sellerId: 'u_maya', niche: 'cooking', title: 'Fresh Pasta Field Notes', category: 'Recipe collection', format: 'digital', priceCents: 800, linkedPostId: 'p_tagliatelle', mediaColor: '#C8553D', mediaLabel: 'Pasta field notes cover', description: 'Eight weeks of my fresh pasta goal: the dough ratios that worked, the ones that didn’t, and 12 shapes with step-by-step photos. 34-page PDF.', createdAt: now - 2 * D, sold: 41 },
    { id: 'l_weeknight_loaves', sellerId: 'u_dev', niche: 'cooking', title: 'Weeknight Loaves (printed)', category: 'Cookbook', format: 'physical', priceCents: 2400, shippingCents: 500, stock: 18, linkedPostId: 'p_sourdough', mediaColor: '#C9A877', mediaLabel: 'Weeknight Loaves book', description: 'A small spiral-bound cookbook: sourdough that fits around a 9-to-5, with a printable starter schedule. 60 pages, printed and bound by hand.', createdAt: now - 5 * D, sold: 27 },
    { id: 'l_chili_crisp', sellerId: 'u_jules', niche: 'cooking', title: 'Chili Crisp: 12 Variations', category: 'Zine', format: 'physical', priceCents: 1400, shippingCents: 400, stock: 40, linkedPostId: 'p_chili', mediaColor: '#5E2A22', mediaLabel: 'Chili crisp zine', description: 'A risograph zine of my chili crisp base recipe plus 12 riffs: Sichuan, smoky chipotle, sesame-heavy, and more.', createdAt: now - 1 * D, sold: 63 },
    { id: 'l_weeknight_fancy', sellerId: 'u_priya', niche: 'cooking', title: 'Weeknight Fancy', category: 'Cookbook', format: 'physical', priceCents: 2800, shippingCents: 500, stock: 9, linkedPostId: 'p_beets', mediaColor: '#8E2F4F', mediaLabel: 'Weeknight Fancy cookbook', description: '30 dinners that look like effort and take under 40 minutes. Printed softcover, 96 pages.', createdAt: now - 9 * D, sold: 15 },
    { id: 'l_herb_chart', sellerId: 'u_theo', niche: 'cooking', title: 'Herb Pairing Chart', category: 'Kitchen print', format: 'physical', priceCents: 1800, shippingCents: 300, mediaColor: '#6E8B4E', mediaLabel: 'Herb pairing chart print', description: 'An 11×14 print of which herbs go with what. Printed on heavy matte paper, made to order.', createdAt: now - 3 * D, sold: 22 },
    // Art
    { id: 'l_harbor_original', sellerId: 'u_rosa', niche: 'art', title: 'Harbor at Dusk (original)', category: 'Original artwork', format: 'physical', priceCents: 24000, shippingCents: 1200, stock: 1, linkedPostId: 'p_art_harbor', mediaColor: '#5A6FD0', mediaLabel: 'Harbor at dusk watercolor', description: 'The original 9×12 watercolor on cold-press paper, signed. One of one, shipped flat with a backing board.', createdAt: now - 2 * H, sold: 0 },
    { id: 'l_harbor_print', sellerId: 'u_rosa', niche: 'art', title: 'Harbor at Dusk (print, 8×10)', category: 'Print', format: 'physical', priceCents: 3500, shippingCents: 400, mediaColor: '#7083D8', mediaLabel: 'Harbor at dusk print', description: 'Archival giclée print of the original, signed on the back.', createdAt: now - 2 * H, sold: 8 },
    { id: 'l_corner_store', sellerId: 'u_kenji', niche: 'art', title: 'Corner Store, Ink (print)', category: 'Print', format: 'physical', priceCents: 2500, shippingCents: 400, linkedPostId: 'p_art_street', mediaColor: '#2D3142', mediaLabel: 'Corner store ink print', description: 'A 8×10 print of my ten-minute ink sketch of the corner store on 5th.', createdAt: now - 9 * H, sold: 12 },
    { id: 'l_street_zine', sellerId: 'u_kenji', niche: 'art', title: 'Street Sketches, Vol. 2', category: 'Zine', format: 'physical', priceCents: 1200, shippingCents: 300, stock: 25, mediaColor: '#8C5E58', mediaLabel: 'Street sketches zine', description: '24 pages of everyday street sketches, risograph printed.', createdAt: now - 6 * D, sold: 30 },
    // Photography
    { id: 'l_golden_print', sellerId: 'u_nadia', niche: 'photography', title: 'Golden Hour, 35mm (11×14)', category: 'Print', format: 'physical', priceCents: 4500, shippingCents: 600, linkedPostId: 'p_photo_golden', mediaColor: '#D98A3D', mediaLabel: 'Golden hour print', description: 'Printed from the scanned negative on lustre paper. Signed and numbered.', createdAt: now - 4 * H, sold: 19 },
    { id: 'l_portra_presets', sellerId: 'u_nadia', niche: 'photography', title: 'Warm Film Presets', category: 'Presets', format: 'digital', priceCents: 1500, mediaColor: '#E0A86B', mediaLabel: 'Warm film presets', description: 'Six Lightroom presets for a warm, film-like look. Works on phone and desktop.', createdAt: now - 8 * D, sold: 112 },
    { id: 'l_rain_print', sellerId: 'u_omar', niche: 'photography', title: 'Rain, Night (print)', category: 'Print', format: 'physical', priceCents: 4000, shippingCents: 600, linkedPostId: 'p_photo_night', mediaColor: '#1F2A44', mediaLabel: 'Rainy street at night print', description: 'A 12×18 print of the rainy-night street, on metallic paper so the lights glow.', createdAt: now - 12 * H, sold: 6 },
  ];
}
