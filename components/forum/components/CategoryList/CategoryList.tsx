import Alert from '@mui/material/Alert';
import ButtonGroup from '@mui/material/ButtonGroup';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

interface CategoryListProps {
  disabled: boolean;
}

export default function CategoryList ({ disabled }: CategoryListProps) {
  const currentSpace = useCurrentSpace();
  const { push, query } = useRouter();

  const { data: categories, error, isValidating } = useSWR(currentSpace ? '/forum/categories' : null, () => charmClient.forum.listPostCategories(currentSpace!.id));

  const handleClick = (name: string) => {
    push({
      pathname: `/${query.domain}/forum`,
      query: { category: name }
    }, undefined, { shallow: true });
  };

  if (isValidating) {
    return (<LoadingComponent isLoading size={50} />);
  }

  if (error) {
    return (<Alert severity='error'>An error occured while loading categories</Alert>);
  }

  if (!categories) {
    return null;
  }

  return (
    <ButtonGroup orientation='vertical' sx={{ alignItems: 'flex-start' }} color='inherit' disabled={disabled}>
      {categories.map(category => (
        <Button key={category} variant='text' onClick={() => handleClick(category)} disabled={disabled}>{category}</Button>
      ))}
    </ButtonGroup>
  );
}
