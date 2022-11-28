import ButtonGroup from '@mui/material/ButtonGroup';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import { useRouter } from 'next/router';

import Button from 'components/common/Button';

interface FilterListProps {
  disabled: boolean;
  categories: string[];
  handleClick: (id: string) => void;
  sortList: string[];
}

export default function FilterList (props: FilterListProps) {
  const { disabled = false, handleClick, categories, sortList } = props;
  const { query } = useRouter();

  return (
    <Card variant='outlined'>
      <CardContent>
        <ButtonGroup orientation='vertical' sx={{ alignItems: 'flex-start' }} color='inherit' disabled={disabled}>
          {sortList.map(sort => (
            <Button key={sort} variant='text' onClick={() => handleClick(sort)} sx={{ fontWeight: sort === query.sort ? 'bold' : 'initial' }}>{sort}</Button>
          ))}
        </ButtonGroup>
        <Divider sx={{ pt: '10px', mb: '10px' }} />
        <ButtonGroup orientation='vertical' sx={{ alignItems: 'flex-start' }} color='inherit' disabled={disabled}>
          {categories.map(category => (
            <Button key={category} variant='text' onClick={() => handleClick(category)} disabled={disabled} sx={{ fontWeight: category === query.category ? 'bold' : 'initial' }}>{category}</Button>
          ))}
        </ButtonGroup>
      </CardContent>
    </Card>
  );
}
