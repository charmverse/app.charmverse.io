import { link } from '@bangle.dev/base-components';
import { useEditorViewContext } from '@bangle.dev/react';
import { Stack, TextField } from '@mui/material';
import React, { useState } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';

export function LinkSubMenu() {
  const view = useEditorViewContext();
  const result = link.queryLinkAttrs()(view.state);
  const originalHref = (result && result.href) || '';
  const [href, setHref] = useState(originalHref);
  const isSavedDisabled = href === originalHref || !/^(ipfs|http(s?)):\/\//i.test(href);
  const handleSubmit = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isSavedDisabled && e.code === 'Enter') {
      e.preventDefault();
      link.updateLink(href)(view.state, view.dispatch);
      view.focus();
    }
  };

  return (
    <Stack
      sx={{
        px: 1,
        minWidth: 350
      }}
      py={1}
      key={originalHref}
    >
      <FieldLabel variant='subtitle2'>Link</FieldLabel>
      <TextField value={href} onChange={(e) => setHref(e.target.value)} autoFocus onKeyDown={handleSubmit} />
    </Stack>
  );
}
