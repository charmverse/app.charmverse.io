import { EditOutlined, RateReviewOutlined, VisibilityOutlined } from '@mui/icons-material';
import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction, MutableRefObject } from 'react';

import type { FrontendParticipant } from 'components/common/CharmEditor/components/fiduswriter/collab';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

const EDIT_MODES = ['editing', 'suggesting', 'viewing'] as const;
export type EditMode = (typeof EDIT_MODES)[number];

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

interface CharmEditorContext {
  isSaving: boolean;
  availableEditModes: EditMode[];
  editMode: EditMode | null;
  permissions: IPagePermissionFlags | null;
  participants: FrontendParticipant[];
  printRef: MutableRefObject<any> | null;
}

interface CharmEditorContextWithSetter extends CharmEditorContext {
  setPageProps: Dispatch<SetStateAction<Partial<CharmEditorContext>>>;
  resetPageProps: () => void;
}

const defaultProps = {
  isSaving: false,
  availableEditModes: [],
  editMode: null,
  permissions: null,
  participants: [],
  printRef: null
};

const CharmEditorContext = createContext<Readonly<CharmEditorContextWithSetter>>({
  ...defaultProps,
  setPageProps: () => {},
  resetPageProps: () => {}
});

export function CharmEditorProvider({ children }: { children: ReactNode }) {
  const [props, _setPageProps] = useState<CharmEditorContext>(defaultProps);

  const availableEditModes = Object.entries(EDIT_MODE_CONFIG)
    .filter(([, config]) => {
      return !!props.permissions?.[config.permission];
    })
    .map(([mode]) => mode as EditMode);

  const setPageProps: CharmEditorContextWithSetter['setPageProps'] = (_props) => {
    _setPageProps((prev) => ({ ...prev, ..._props }));
  };

  const resetPageProps: CharmEditorContextWithSetter['resetPageProps'] = () => {
    _setPageProps({ ...defaultProps });
  };

  const value: CharmEditorContextWithSetter = useMemo(
    () => ({
      ...props,
      availableEditModes,
      setPageProps,
      resetPageProps
    }),
    [props]
  );

  return <CharmEditorContext.Provider value={value}>{children}</CharmEditorContext.Provider>;
}

export const useCharmEditor = () => useContext(CharmEditorContext);
