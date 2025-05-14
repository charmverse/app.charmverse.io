import { configureStore } from '@reduxjs/toolkit';

import { reducer as boardsReducer } from './boards';
import { reducer as cardsReducer } from './cards';
import { reducer as languageReducer } from './language';
import { reducer as loadingStateReducer } from './loadingState';
import { reducer as searchTextReducer } from './searchText';
import { reducer as viewsReducer } from './views';

const store = configureStore({
  reducer: {
    language: languageReducer,
    boards: boardsReducer,
    views: viewsReducer,
    cards: cardsReducer,
    searchText: searchTextReducer,
    loadingState: loadingStateReducer
  }
});

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
