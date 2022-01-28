
export const PATH_BLACKLIST = ['settings'];

export interface Page {
  id: string;
  title: string;
  content: PageContent;
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

export interface PageContent {
  type: string,
  content?: (PageContent | TextContent)[],
  attrs?: Record<string, any>
  marks?: PageMark[]
}

interface PageMark {
  type: string
  attrs?: Record<string, any>
}

interface TextContent {
  text: string
  type: "text"
}