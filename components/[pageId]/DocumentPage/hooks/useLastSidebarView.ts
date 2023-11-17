import { useLocalStorage } from 'hooks/useLocalStorage';
import type { PageSidebarView } from 'hooks/usePageSidebar';

export function useLastSidebarView() {
  return useLocalStorage<Record<string, PageSidebarView | null>>('active-sidebar-view', {});
}
