// import './Component.scss';

import styled from '@emotion/styled';
import { useCallback, useEffect, useState } from 'react';

import Link from 'components/common/Link';

import type { CharmNodeViewProps } from '../nodeView/nodeView';

type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

const StyledComponent = styled.div`
  background: rgba(black, 0.1);
  border-radius: 0.5rem;
  opacity: 0.75;
  padding: 0.75rem;

  .toc-list {
    list-style: none;
    padding: 0;

    &::before {
      content: 'Table of Contents';
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.025rem;
      opacity: 0.5;
      text-transform: uppercase;
    }
  }

  .toc-item {
    &--2 {
      padding-left: 1rem;
    }
    &--3 {
      padding-left: 2rem;
    }

    &--4 {
      padding-left: 3rem;
    }

    &--5 {
      padding-left: 4rem;
    }

    &--6 {
      padding-left: 5rem;
    }
  }
`;

export function TableOfContents({ view }: CharmNodeViewProps) {
  const [items, setItems] = useState<HeadingItem[]>([]);

  const handleUpdate = useCallback(() => {
    const headings: HeadingItem[] = [];
    const transaction = view.state.tr;

    view.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const id = `heading-${headings.length + 1}`;

        if (node.attrs.id !== id) {
          transaction.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            id
          });
        }

        headings.push({
          level: node.attrs.level,
          text: node.textContent,
          id
        });
      }
    });

    transaction.setMeta('addToHistory', false);
    transaction.setMeta('preventUpdate', true);

    view.dispatch(transaction);

    setItems(headings);
  }, [view.state]);

  useEffect(handleUpdate, []);

  // useEffect(() => {
  //   if (!view.state) {
  //     return null;
  //   }

  //   view.on('update', handleUpdate);

  //   return () => {
  //     editor.off('update', handleUpdate);
  //   };
  // }, [view.state]);

  return (
    <StyledComponent>
      <ul className='toc-list'>
        {items.map((item) => (
          <li key={item.id} className={`toc-item toc-item--${item.level}`}>
            <Link href={`#${item.id}`} external>
              {item.text}
            </Link>
          </li>
        ))}
      </ul>
    </StyledComponent>
  );
}
