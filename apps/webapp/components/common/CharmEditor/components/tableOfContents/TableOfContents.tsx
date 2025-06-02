// import './Component.scss';

import { styled, Typography } from '@mui/material';
import { NodeSelection } from 'prosemirror-state';
import { useCallback, useEffect, useState } from 'react';

import Link from 'components/common/Link';

import { getHeadingLink } from '../heading';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

// Table Of Contents inspiration: https://tiptap.dev/guide/node-views/examples#table-of-contents

type HeadingItem = {
  pos: number;
  text: string;
  level: number;
};

const StyledComponent = styled('div')`
  opacity: 0.75;
  font-size: 0.9rem;

  .toc-item {
    &--2 {
      padding-left: 2rem;
    }
    &--3 {
      padding-left: 4rem;
    }

    &--4 {
      padding-left: 6rem;
    }

    &--5 {
      padding-left: 8rem;
    }

    &--6 {
      padding-left: 10rem;
    }
  }
`;

const NestedPageContainer = styled(Link)`
  align-items: center;
  cursor: pointer;
  display: flex;
  font-weight: 600;
  padding: 3px 3px 3px 2px;
  position: relative;
  transition: background 20ms ease-in 0s;

  span {
    border-bottom: 0.05em solid var(--link-underline);
  }

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    .actions-menu {
      opacity: 0;
    }

    &:hover {
      background-color: ${({ theme }) => theme.palette.background.light};

      .actions-menu {
        opacity: 1;
      }
    }
  }
`;

export function TableOfContents({ view }: CharmNodeViewProps) {
  const [items, setItems] = useState<HeadingItem[] | null>(null);

  const handleUpdate = useCallback(() => {
    const headings: HeadingItem[] = [];

    view.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        headings.push({
          level: node.attrs.level,
          pos,
          text: node.textContent
        });
      }
    });

    setItems(headings);
  }, [view.state.doc]);

  function highlightHeading(item: HeadingItem) {
    const transaction = view.state.tr.setSelection(NodeSelection.create(view.state.doc, item.pos));
    view.dispatch(transaction);
  }

  useEffect(() => {
    handleUpdate();
  }, [view.state.doc]);

  return (
    <StyledComponent>
      {items?.map((item) => (
        <NestedPageContainer
          color='inherit'
          draggable={false}
          key={item.text}
          href={getHeadingLink(item.text)}
          onClick={() => highlightHeading(item)}
          external
          className={`toc-item--${item.level}`}
        >
          <span>{item.text}</span>
        </NestedPageContainer>
      ))}
      {items?.length === 0 && <NestedPageContainer>Add headings to create a table of contents</NestedPageContainer>}
    </StyledComponent>
  );
}
