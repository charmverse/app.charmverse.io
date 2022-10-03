
import { configureStore } from '@reduxjs/toolkit';

import { reducer as boardsReducer } from './boards';
import { reducer as cardsReducer } from './cards';
import { reducer as clientConfigReducer } from './clientConfig';
import { reducer as commentsReducer } from './comments';
import { reducer as globalErrorReducer } from './globalError';
import { reducer as globalTemplatesReducer } from './globalTemplates';
import { reducer as languageReducer } from './language';
import { reducer as searchTextReducer } from './searchText';
import { reducer as usersReducer } from './users';
import { reducer as viewsReducer } from './views';

const store = configureStore({
  reducer: {
    users: usersReducer,
    language: languageReducer,
    globalTemplates: globalTemplatesReducer,
    boards: boardsReducer,
    views: viewsReducer,
    cards: cardsReducer,
    comments: commentsReducer,
    searchText: searchTextReducer,
    globalError: globalErrorReducer,
    clientConfig: clientConfigReducer
  }
});

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
