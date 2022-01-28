
export const PATH_BLACKLIST = ['settings'];

export interface Page {
  id: string;
  title: string;
  content: string;
  created: Date;
  headerImage?: string;
  icon?: string;
  isPublic: boolean;
  path: string;
  parentPageId?: string;
  spaceId: string;
  updated?: Date;
}

export interface PagePermission {
  pageId: string;
  userId: string;
  level: 'full_access' | 'editor' | 'view_comment' | 'view';
}