import { useMemo } from 'react';
import { PagesContext } from 'hooks/usePages';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import CenterPanel from './components/CenterPanel';
import { DatabaseContext } from './Database.context';

// loosely based off BoardPage.tsx in focalboard

export default function Database (props: DatabaseContext) {

  const pagesValues: PagesContext = useMemo(() => ({
    currentPageId: '',
    pages: props.pages,
    setCurrentPageId: () => '',
    setPages: () => undefined,
    isEditing: true,
    setIsEditing: () => { },
    getPagePermissions: () => new AllowedPagePermissions(),
    refreshPage: () => Promise.resolve({} as any)
  }), [props.cards]);

  return (
    <DatabaseContext.Provider value={props}>
      <PagesContext.Provider value={pagesValues}>
        <div className='focalboard-body' style={{ flexGrow: 1 }}>
          <CenterPanel {...props} />

          {/* TODO: Add modal to view rows and cards (see BoardPage.tsx) */}
        </div>
      </PagesContext.Provider>
    </DatabaseContext.Provider>
  );
}
