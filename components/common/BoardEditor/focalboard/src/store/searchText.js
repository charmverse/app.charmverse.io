"use strict";
exports.__esModule = true;
exports.getSearchText = exports.reducer = exports.setSearchText = void 0;
var toolkit_1 = require("@reduxjs/toolkit");
var searchTextSlice = (0, toolkit_1.createSlice)({
    name: 'searchText',
    initialState: { value: '' },
    reducers: {
        setSearchText: function (state, action) {
            state.value = action.payload;
        }
    }
});
exports.setSearchText = searchTextSlice.actions.setSearchText;
exports.reducer = searchTextSlice.reducer;
function getSearchText(state) {
    return state.searchText.value;
}
exports.getSearchText = getSearchText;
