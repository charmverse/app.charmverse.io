import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useDatabaseBlocks } from './useDatabaseBlocks';
import { useLocalStorage } from './useLocalStorage';
import { usePages } from './usePages';

type FocalboardViewsRecord = Record<string, null | string>;

interface IContext {
  focalboardViewsRecord: FocalboardViewsRecord,
  setFocalboardViewsRecord: React.Dispatch<React.SetStateAction<FocalboardViewsRecord>>
}

export const FocalboardViewsContext = createContext<Readonly<IContext>>({
  focalboardViewsRecord: {},
  setFocalboardViewsRecord: () => null
});

export function FocalboardViewsProvider ({ children }: { children: ReactNode }) {
  const { blocks } = useDatabaseBlocks();
  const { pages } = usePages();
  const [focalboardViewsRecord, setFocalboardViewsRecord] = useState<FocalboardViewsRecord>({});
  const [localStorageValue] = useLocalStorage('focalboard.views', focalboardViewsRecord);

  useEffect(() => {
    pages.forEach(page => {
      // Get the value from localstorage first
      if (page.type === 'board' && page.boardId) {
        focalboardViewsRecord[page.boardId] = localStorageValue?.[page.boardId] ?? null;
      }
    });

    blocks.forEach(block => {
      // Set it to the first view
      if (block.type === 'view' && focalboardViewsRecord[block.parentId] === null) {
        focalboardViewsRecord[block.parentId] = block.id;
      }
    });

    setFocalboardViewsRecord(focalboardViewsRecord);
  }, [blocks, pages]);

  const value = useMemo<IContext>(() => {
    return {
      focalboardViewsRecord,
      setFocalboardViewsRecord: setFocalboardViewsRecord as any
    };
  }, [blocks, pages]);

  return (
    <FocalboardViewsContext.Provider value={value}>
      {children}
    </FocalboardViewsContext.Provider>
  );
}

export const useFocalboardViews = () => useContext(FocalboardViewsContext);
