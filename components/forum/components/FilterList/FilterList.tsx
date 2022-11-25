import ButtonGroup from '@mui/material/ButtonGroup';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';

import Button from 'components/common/Button';

interface FilterListProps {
  disabled: boolean;
  categories: string[];
  handleClick: (id: string) => void;
  sortList: string[];
}

export default function FilterList (props: FilterListProps) {
  const { disabled = false, handleClick, categories, sortList } = props;

  return (
    <Card variant='outlined'>
      <CardContent>
        <ButtonGroup orientation='vertical' sx={{ alignItems: 'flex-start' }} color='inherit' disabled={disabled}>
          {sortList.map(btn => (
            <Button key={btn} variant='text' onClick={() => handleClick(btn)}>{btn}</Button>
          ))}
        </ButtonGroup>
        <Divider sx={{ pt: '10px', mb: '10px' }} />
        <ButtonGroup orientation='vertical' sx={{ alignItems: 'flex-start' }} color='inherit' disabled={disabled}>
          {categories.map(category => (
            <Button key={category} variant='text' onClick={() => handleClick(category)} disabled={disabled}>{category}</Button>
          ))}
        </ButtonGroup>
      </CardContent>
    </Card>
  );
}
