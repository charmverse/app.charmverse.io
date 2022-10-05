import debounce from 'lodash/debounce';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { FormattedMessage, useIntl } from 'react-intl';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getSearchText, setSearchText } from '../../store/searchText';
import Button from '../../widgets/buttons/button';
import Editable from '../../widgets/editable';

function ViewHeaderSearch (): JSX.Element {
  const searchText = useAppSelector<string>(getSearchText);
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const router = useRouter();

  const searchFieldRef = useRef<{ focus(selectAll?: boolean): void }>(null);
  const [isSearching, setIsSearching] = useState(Boolean(searchText));
  const [searchValue, setSearchValue] = useState(searchText);
  const [currentView, setCurrentView] = useState(router.query.viewId as string);

  const dispatchSearchText = (value: string) => {
    dispatch(setSearchText(value));
  };

  const debouncedDispatchSearchText = useMemo(() => debounce(dispatchSearchText, 200), []);

  useEffect(() => {
    const viewId = router.query.viewId as string;
    if (viewId !== currentView) {
      setCurrentView(viewId);
      setSearchValue('');
      setIsSearching(false);

      // Previously debounced calls to change the search text should be cancelled
      // to avoid resetting the search text.
      debouncedDispatchSearchText.cancel();
      dispatchSearchText('');
    }
  }, [router.query.url]);

  useEffect(() => {
    return () => {
      debouncedDispatchSearchText.cancel();
    };
  }, []);

  useEffect(() => {
    searchFieldRef.current?.focus();
  }, [isSearching]);

  useHotkeys('ctrl+shift+f,cmd+shift+f', () => {
    setIsSearching(true);
    searchFieldRef.current?.focus(true);
  });

  if (isSearching) {
    return (
      <Editable
        ref={searchFieldRef}
        value={searchValue}
        placeholderText={intl.formatMessage({ id: 'ViewHeader.search-text', defaultMessage: 'Search text' })}
        onChange={(value) => {
          setSearchValue(value);
          debouncedDispatchSearchText(value);
        }}
        onCancel={() => {
          setSearchValue('');
          setIsSearching(false);
          debouncedDispatchSearchText('');
        }}
        onSave={() => {
          if (searchValue === '') {
            setIsSearching(false);
          }
          debouncedDispatchSearchText(searchValue);
        }}
      />
    );
  }
  return (
    <Button onClick={() => setIsSearching(true)}>
      <FormattedMessage
        id='ViewHeader.search'
        defaultMessage='Search'
      />
    </Button>
  );
}

export default ViewHeaderSearch;
