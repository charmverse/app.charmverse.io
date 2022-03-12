import { Page, Prisma } from '@prisma/client';
import charmClient from 'charmClient';
import { addBoardClicked } from 'components/databases/focalboard/src/components/sidebar/sidebarAddBoardMenu';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { useRouter } from 'next/router';
import * as React from 'react';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

type AddPageFn = (page?: Partial<Page>) => Promise<Page>;
type IContext = {
  currentPage: Page | null,
  pages: Record<string, Page>,
  setCurrentPage: Dispatch<SetStateAction<Page | null>>,
  setPages: Dispatch<SetStateAction<Record<string, Page>>>,
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
  addPage: AddPageFn,
  addPageAndRedirect: (page?: Partial<Page>) => void
};

export const PagesContext = createContext<Readonly<IContext>>({
  currentPage: null,
  pages: {},
  setCurrentPage: () => undefined,
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
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const router = useRouter();
  const intl = useIntl();
  const [user] = useUser();

  useEffect(() => {
    if (space) {
      setPages({});
      charmClient.getPages(space.id)
        .then(_pages => {
          const state: { [key: string]: Page } = {};
          for (const page of _pages) {
            state[page.id] = page;
          }
          setPages(state);
        });
    }
  }, [space?.id]);

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
  console.log('pages provider');

  const value: IContext = useMemo(() => ({
    currentPage,
    isEditing,
    setIsEditing,
    pages,
    setCurrentPage,
    setPages,
    addPage,
    addPageAndRedirect
  }), [currentPage, isEditing, router, pages, user]);

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}

export const usePages = () => useContext(PagesContext);
