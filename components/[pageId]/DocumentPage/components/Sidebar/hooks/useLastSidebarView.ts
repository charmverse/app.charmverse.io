import type { PageSidebarView } from 'components/[pageId]/DocumentPage/components/Sidebar/hooks/usePageSidebar';
import { useLocalStorage } from 'hooks/useLocalStorage';

export function useLastSidebarView() {
  return useLocalStorage<Record<string, PageSidebarView | null>>('active-sidebar-view', {});
}
