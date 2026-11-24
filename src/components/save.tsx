import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useToast } from '@/components/toast';
import { useNiches, useStore } from '@/lib/store';

/**
 * Saving a post (founder's pick, Nov 2026): it saves right away, then a toast
 * offers "Add to collection" for a few seconds, like Instagram.
 */
export function useSavePost() {
  const router = useRouter();
  const toast = useToast();
  const { state, actions } = useStore();
  const niches = useNiches();
  return useCallback(
    (postId: string) => {
      const wasSaved = !!state.saves[postId];
      // In the post's niche color (founder, Nov 24 2026).
      const p = state.posts.find((x) => x.id === postId);
      const tint = p ? niches[p.niche].ink : undefined;
      actions.toggleSave(postId);
      if (wasSaved) {
        const onBoards = state.boards.some((b) => b.ownerId === state.me?.id && b.postIds.includes(postId));
        toast(onBoards ? 'Removed from saved and your collections' : 'Removed from saved', undefined, tint);
      } else {
        toast('Saved', { label: 'Add to collection', onPress: () => router.push({ pathname: '/boards/add', params: { postId } }) }, tint);
      }
    },
    [state.saves, state.boards, state.me, state.posts, niches, actions, toast, router],
  );
}
