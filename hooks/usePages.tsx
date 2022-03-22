import { Page, Prisma } from '@prisma/client';
import useSWR from 'swr';
import charmClient from 'charmClient';
import { addBoardClicked } from 'components/databases/focalboard/src/components/sidebar/sidebarAddBoardMenu';
import { useRouter } from 'next/router';
import * as React from 'react';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

type AddPageFn = (page?: Partial<Page>) => Promise<Page>;
type IContext = {
  currentPageId: string,
  pages: Record<string, Page | undefined>,
  setCurrentPageId: Dispatch<SetStateAction<string>>,
  setPages: Dispatch<SetStateAction<Record<string, Page>>>,
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
  addPage: AddPageFn,
  addPageAndRedirect: (page?: Partial<Page>) => void
};

const refreshInterval = 1000 * 5 * 60; // 5 minutes

export const PagesContext = createContext<Readonly<IContext>>({
  currentPageId: '',
  pages: {},
  setCurrentPageId: () => '',
  setPages: () => undefined,
  isEditing: true,
  setIsEditing: () => { },
  addPage: null as any,
  addPageAndRedirect: null as any
});

export function PagesProvider ({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [space] = useCurrentSpace();
  const [pages, setPages] = useState<Record<string, Page>>({});
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const router = useRouter();
  const intl = useIntl();
  const [user] = useUser();

  const { data } = useSWR(() => space ? `pages/${space?.id}` : null, () => charmClient.getPages(space!.id), { refreshInterval });
  useEffect(() => {
    setPages(data?.reduce((acc, page) => ({ ...acc, [page.id]: page }), {}) || {});
  }, [data]);

  const addPage: AddPageFn = React.useCallback(async (page) => {
    const spaceId = space?.id!;
    const id = Math.random().toString().replace('0.', '');
    const pageProperties: Prisma.PageCreateInput = {
      content: {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: []
        }]
      } as any,
      contentText: '',
      createdAt: new Date(),
      author: {
        connect: {
          id: user!.id
        }
      },
      updatedAt: new Date(),
      updatedBy: user!.id,
      path: `page-${id}`,
      space: {
        connect: {
          id: spaceId
        }
      },
      title: '',
      type: 'page',
      ...(page ?? {})
    };
    if (pageProperties.type === 'board') {
      await addBoardClicked(boardId => {
        pageProperties.boardId = boardId;
      }, intl);
    }
    const newPage = await charmClient.createPage(pageProperties);
    setPages({ ...pages, [newPage.id]: newPage });
    return newPage;
  }, [intl, pages, space, user]);

  const addPageAndRedirect = async (page?: Partial<Page>) => {
    const newPage = await addPage(page);
    router.push(`/${(space!).domain}/${newPage.path}`);
  };

  const value: IContext = useMemo(() => ({
    currentPageId,
    isEditing,
    setIsEditing,
    pages,
    setCurrentPageId,
    setPages,
    addPage,
    addPageAndRedirect
  }), [currentPageId, isEditing, router, pages, user]);

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}

export const usePages = () => useContext(PagesContext);
