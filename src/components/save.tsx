import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useToast } from '@/components/toast';
import { useStore } from '@/lib/store';

/**
 * Saving a post (founder's pick, Nov 2026): it saves right away, then a toast
 * offers "Add to collection" for a few seconds, like Instagram.
 */
export function useSavePost() {
  const router = useRouter();
  const toast = useToast();
  const { state, actions } = useStore();
  return useCallback(
    (postId: string) => {
      const wasSaved = !!state.saves[postId];
      actions.toggleSave(postId);
      if (wasSaved) {
        const onBoards = state.boards.some((b) => b.ownerId === state.me?.id && b.postIds.includes(postId));
        toast(onBoards ? 'Removed from saved and your collections' : 'Removed from saved');
      } else {
        toast('Saved', { label: 'Add to collection', onPress: () => router.push({ pathname: '/boards/add', params: { postId } }) });
      }
    },
    [state.saves, state.boards, state.me, actions, toast, router],
  );
}
