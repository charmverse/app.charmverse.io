import { Collapse, Stack } from '@mui/material';
import { useEffect, useState } from 'react';

import { ExpandableSectionTitle } from 'components/common/ExpandableSectionTitle';

type Props = {
  title: string;
  forceExpand?: boolean;
  children: React.ReactNode;
};

export function ExpandableSection({ title, forceExpand, children }: Props) {
  const [isExpanded, setIsExpanded] = useState(!!forceExpand);

  useEffect(() => {
    if (typeof forceExpand !== 'undefined') {
      setIsExpanded(forceExpand);
    }
  }, [forceExpand]);

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  return (
    <Stack>
      <ExpandableSectionTitle title={title} isExpanded={isExpanded} toggleExpanded={toggleExpanded} />

      <Collapse in={isExpanded} timeout='auto' unmountOnExit>
        {children}
      </Collapse>
    </Stack>
  );
}
