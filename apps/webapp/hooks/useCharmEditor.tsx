import type { PagePermissionFlags } from '@charmverse/core/permissions';
import { EditOutlined, RateReviewOutlined, VisibilityOutlined } from '@mui/icons-material';
import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction, MutableRefObject } from 'react';

import type { FrontendParticipant } from 'components/common/CharmEditor/components/fiduswriter/collab';

export const EDIT_MODE_CONFIG = {
  editing: {
    permission: 'edit_content',
    icon: <EditOutlined fontSize='small' />,
    color: 'primary',
    label: 'Editing'
  },
  suggesting: {
    permission: 'comment',
    icon: <RateReviewOutlined fontSize='small' />,
    color: 'success',
    label: 'Suggesting'
  },
  viewing: {
    permission: 'read',
    icon: <VisibilityOutlined fontSize='small' />,
    color: 'secondary',
    label: 'Viewing'
  }
} as const;

export type EditMode = keyof typeof EDIT_MODE_CONFIG;

interface CharmEditorContext {
  isSaving: boolean;
  editMode: EditMode | null;
  permissions: PagePermissionFlags | null;
  participants: FrontendParticipant[];
  printRef: MutableRefObject<any> | null;
}

interface CharmEditorContextWithSetter extends CharmEditorContext {
  setPageProps: Dispatch<SetStateAction<Partial<CharmEditorContext>>>;
  resetPageProps: () => void;
}

const defaultProps = {
  isSaving: false,
  editMode: null,
  permissions: null,
  participants: [],
  printRef: null
};

const CharmEditorContext = createContext<Readonly<CharmEditorContextWithSetter | null>>(null);

export function CharmEditorProvider({ children }: { children: ReactNode }) {
  const [props, _setPageProps] = useState<CharmEditorContext>(defaultProps);

  const setPageProps: CharmEditorContextWithSetter['setPageProps'] = (_props) => {
    _setPageProps((prev) => ({ ...prev, ..._props }));
  };

  const resetPageProps: CharmEditorContextWithSetter['resetPageProps'] = () => {
    _setPageProps({ ...defaultProps });
  };

  const value: CharmEditorContextWithSetter = useMemo(
    () => ({
      ...props,
      setPageProps,
      resetPageProps
    }),
    [props]
  );

  return <CharmEditorContext.Provider value={value}>{children}</CharmEditorContext.Provider>;
}

export const useCharmEditor = () => {
  const context = useContext(CharmEditorContext);
  if (!context) {
    throw new Error('useCharmEditor must be used within a CharmEditorProvider');
  }
  return context;
};
