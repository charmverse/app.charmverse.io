import React, { ReactElement, useReducer, useMemo, useContext } from 'react';
import type { ISuggestingBounty } from 'models/Bounty';

function suggestionReducer (state: any, action: any) {
  switch (action.type) {
    case 'ADD_SUGGESTED_BOUNTY':
      return {
        suggestedBounties: [...state.suggestedBounties, action.item]
      };
    default:
      throw new Error();
  }
}

const SuggestionContext = React.createContext<any | null>(null);

export function SuggestionProvider (props: { children: React.ReactNode }): ReactElement {
  const initialSuggestionState = { suggestedBounties: [] };
  const [state, dispatch] = useReducer(suggestionReducer, initialSuggestionState);
  const contextValue = useMemo(
    () => ({
      suggestedBounties: state.suggestedBounties,
      addBounty: (bounty: ISuggestingBounty) => {
        dispatch({ type: 'ADD_SUGGESTED_BOUNTY', item: bounty });
      }
    }),
    [state, dispatch]
  );
  const { children } = props;
  return <SuggestionContext.Provider value={contextValue}>{children}</SuggestionContext.Provider>;
}

export const useBountySuggestion = () => useContext(SuggestionContext);
