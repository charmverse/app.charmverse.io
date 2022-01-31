
export const PATH_BLACKLIST = ['settings'];

export interface PagePermission {
  pageId: string;
  userId: string;
  level: 'full_access' | 'editor' | 'view_comment' | 'view';
}

interface TextContent {
  text: string
  type: 'text'
}

interface PageMark {
  type: string
  attrs?: Record<string, any>
}

export interface PageContent {
  type: string,
  content?: (PageContent | TextContent)[],
  attrs?: Record<string, any>
  marks?: PageMark[]
}

export interface Page {
  id: string;
  title: string;
  content: PageContent;
  created: Date;
  headerImage?: string;
  icon?: string;
  isPublic: boolean;
  path: string;
  parentId: string | null;
  spaceId: string;
  updated?: Date;
}
