import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { getCurrentLanguage, storeLanguage as i18nStoreLanguage } from '../i18n';

import type { RootState } from './index';

export const fetchLanguage = createAsyncThunk('language/fetch', async () => getCurrentLanguage());

export const storeLanguage = createAsyncThunk('language/store', (lang: string) => {
  i18nStoreLanguage(lang);
  return lang;
});

const languageSlice = createSlice({
  name: 'language',
  initialState: { value: 'en' } as { value: string },
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchLanguage.fulfilled, (state, action) => {
      state.value = action.payload;
    });
    builder.addCase(storeLanguage.fulfilled, (state, action) => {
      state.value = action.payload;
    });
  }
});

export const { reducer } = languageSlice;

export function getLanguage(state: RootState): string {
  return state.language.value;
}
