import { useRouter } from 'next/router';

import { useForumCategories } from './useForumCategories';

const sortList = ['Most Popular', 'Newest post', 'Latest Activity'];

export function useForumFilters() {
  const { push, query } = useRouter();
  const { categories } = useForumCategories();

  const getLinkUrl = (value: string) => {
    const isValidSort = value && sortList.some((sortOption) => sortOption === value);
    const isValidCategory = value && categories.some((category) => category.name === value);

    if (isValidSort) {
      return `/${query.domain}/forum/?sort=${value}`;
    }
    if (isValidCategory) {
      return `/${query.domain}/forum/?category=${value}`;
    }

    return `${query.domain}/forum/`;
  };

  const applyFilters = (value: string) => {
    const isValidSort = value && sortList.some((btn) => btn === value);
    const isValidCategory = value && categories.some((category) => category.name === value);

    push(
      {
        pathname: `/${query.domain}/forum`,
        ...(isValidSort && {
          query: { sort: value }
        }),
        ...(isValidCategory && {
          query: { category: value }
        })
      },
      undefined,
      { shallow: true }
    );
  };

  return {
    sortList,
    getLinkUrl,
    applyFilters
  };
}
