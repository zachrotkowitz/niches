// Creators: verified accounts and premium creators who charge for their best
// content. Invite-only for now (the founder approves). Demo: nothing is charged.

import { FEE_RATE } from './shop';

/**
 * Apple and Google take a cut of digital subscriptions bought in the app:
 * 15% for small businesses and for subscriptions after their first year,
 * 30% otherwise. The demo estimates 15%.
 */
export const STORE_FEE_RATE = 0.15;

/** Niches' share of creator earnings. Same 5% as the Shop for now. */
export const CREATOR_FEE_RATE = FEE_RATE;

export const PRICE_OPTIONS = [199, 299, 399, 499, 599, 799, 999];

export type CreatorApplication = {
  status: 'pending' | 'approved';
  niche: string;
  links: string;
  why: string;
  at: number;
};

/** What a creator keeps from one payment, after the app store and Niches. */
export function creatorTake(priceCents: number) {
  const store = Math.round(priceCents * STORE_FEE_RATE);
  const niches = Math.round(priceCents * CREATOR_FEE_RATE);
  return { store, niches, take: priceCents - store - niches };
}
