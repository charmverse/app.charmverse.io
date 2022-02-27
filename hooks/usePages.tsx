import { Page, Prisma, Space } from '@prisma/client';
import charmClient from 'charmClient';
import { addBoardClicked } from 'components/databases/focalboard/src/components/sidebar/sidebarAddBoardMenu';
import { useRouter } from 'next/router';
import * as React from 'react';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

type IContext = {
  currentPage: Page | null,
  pages: Page[],
  setCurrentPage: Dispatch<SetStateAction<Page | null>>,
  setPages: Dispatch<SetStateAction<Page[]>>,
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
  addPage: (space: Space, page: Partial<Page>) => void
};

export const PagesContext = createContext<Readonly<IContext>>({
  currentPage: null,
  pages: [],
  setCurrentPage: () => undefined,
  setPages: () => undefined,
  isEditing: true,
  setIsEditing: () => { },
  addPage: () => { }
});

export function PagesProvider ({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [space] = useCurrentSpace();
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const router = useRouter();
  const intl = useIntl();
  const [user] = useUser();

  useEffect(() => {
    if (space) {
      setPages([]);
      charmClient.getPages(space.id)
        .then(_pages => {
          setPages(_pages);
        });
    }
  }, [space]);

  async function addPage (_space: Space, page: Partial<Page>) {
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
          id: _space.id
        }
      },
      title: '',
      type: 'page',
      ...page
    };
    if (pageProperties.type === 'board') {
      await addBoardClicked(boardId => {
        pageProperties.boardId = boardId;
      }, intl);
    }
    const newPage = await charmClient.createPage(pageProperties);
    setPages([newPage, ...pages]);

    // add delay to simulate a server call
    router.push(`/${_space.domain}/${newPage.path}`);
  }

  const value: IContext = useMemo(() => ({
    currentPage,
    isEditing,
    setIsEditing,
    pages,
    setCurrentPage,
    setPages,
    addPage
  }), [currentPage, isEditing, router, pages, user]);

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}

export const usePages = () => useContext(PagesContext);
