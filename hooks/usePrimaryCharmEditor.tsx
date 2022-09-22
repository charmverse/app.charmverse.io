import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import type { IPagePermissionFlags, PageOperationType } from 'lib/permissions/pages';

export type EditMode = 'editing' | 'suggesting' | 'viewing';

interface PrimaryCharmEditorContext {
  currentPageId: string;
  isSaving: boolean;
  editMode: EditMode | null;
  permissions: IPagePermissionFlags | null;
}

interface PrimaryCharmEditorContextWithSetter extends PrimaryCharmEditorContext {
  setPageProps: Dispatch<SetStateAction<Partial<PrimaryCharmEditorContext>>>;
  resetPageProps: () => void;
}

const defaultProps = {
  currentPageId: '',
  isSaving: false,
  editMode: null,
  permissions: null
};

const CharmEditorContext = createContext<Readonly<PrimaryCharmEditorContextWithSetter>>({
  ...defaultProps,
  setPageProps: () => { },
  resetPageProps: () => { }
});

export function PrimaryCharmEditorProvider ({ children }: { children: ReactNode }) {

  const [props, _setPageProps] = useState<PrimaryCharmEditorContext>(defaultProps);

  const setPageProps: PrimaryCharmEditorContextWithSetter['setPageProps'] = (_props) => {
    _setPageProps((prev) => ({ ...prev, ..._props }));
  };

  const resetPageProps: PrimaryCharmEditorContextWithSetter['resetPageProps'] = () => {
    // _setPageProps({ ...defaultProps });
  };

  const value: PrimaryCharmEditorContextWithSetter = useMemo(() => ({
    ...props,
    setPageProps,
    resetPageProps
  }), [props]);

  return (
    <CharmEditorContext.Provider value={value}>
      {children}
    </CharmEditorContext.Provider>
  );
}

export const usePrimaryCharmEditor = () => useContext(CharmEditorContext);
