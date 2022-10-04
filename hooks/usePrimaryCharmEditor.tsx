import { EditOutlined, RateReviewOutlined, VisibilityOutlined } from '@mui/icons-material';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import type { IPagePermissionFlags } from 'lib/permissions/pages';

const EDIT_MODES = ['editing', 'suggesting', 'viewing'] as const;
export type EditMode = typeof EDIT_MODES[number];

export const EDIT_MODE_CONFIG = {
  editing: {
    permission: 'edit_content',
    icon: <EditOutlined fontSize='small' />
  },
  suggesting: {
    permission: 'comment',
    icon: <RateReviewOutlined fontSize='small' />
  },
  viewing: {
    permission: 'read',
    icon: <VisibilityOutlined fontSize='small' />
  }
} as const;

interface PrimaryCharmEditorContext {
  currentPageId: string;
  isSaving: boolean;
  availableEditModes: EditMode[];
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
  availableEditModes: [],
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

  const availableEditModes = Object.entries(EDIT_MODE_CONFIG).filter(([, config]) => {
    return !!props.permissions?.[config.permission];
  }).map(([mode]) => mode as EditMode);

  const setPageProps: PrimaryCharmEditorContextWithSetter['setPageProps'] = (_props) => {
    _setPageProps((prev) => ({ ...prev, ..._props }));
  };

  const resetPageProps: PrimaryCharmEditorContextWithSetter['resetPageProps'] = () => {
    _setPageProps({ ...defaultProps });
  };

  const value: PrimaryCharmEditorContextWithSetter = useMemo(() => ({
    ...props,
    availableEditModes,
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
