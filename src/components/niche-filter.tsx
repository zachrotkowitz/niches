import { UnderlineTabs } from '@/components/underline-tabs';
import { useNiches } from '@/lib/store';
import { NICHE_ORDER, type NicheId } from '@/lib/theme';

/**
 * Niche filter for mixed-niche screens (Saved): All · Cooking · Art …
 * Quiet tabs, not pills. The selected niche is underlined in its own color,
 * the same color as the borders on the posts below. Empty value means "All".
 */
export function NicheFilter({ value, onChange, available = NICHE_ORDER }: { value: NicheId[]; onChange: (next: NicheId[]) => void; available?: NicheId[] }) {
  const niches = useNiches();
  const current = value.length === 1 ? value[0] : 'all';
  return (
    <UnderlineTabs
      label="Filter by niche"
      inset={10}
      value={current}
      onChange={(key) => onChange(key === 'all' ? [] : [key as NicheId])}
      items={[{ key: 'all', label: 'All' }, ...available.map((id) => ({ key: id, label: niches[id].label, color: niches[id].accent }))]}
    />
  );
}
