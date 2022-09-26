"use strict";
exports.__esModule = true;
exports.getGlobalError = exports.reducer = exports.setGlobalError = void 0;
var toolkit_1 = require("@reduxjs/toolkit");
var initialLoad_1 = require("./initialLoad");
var globalErrorSlice = (0, toolkit_1.createSlice)({
    name: 'globalError',
    initialState: { value: '' },
    reducers: {
        setGlobalError: function (state, action) {
            state.value = action.payload;
        }
    },
    extraReducers: function (builder) {
        builder.addCase(initialLoad_1.initialReadOnlyLoad.rejected, function (state, action) {
            state.value = action.error.message || '';
        });
        builder.addCase(initialLoad_1.initialLoad.rejected, function (state, action) {
            state.value = action.error.message || '';
        });
    }
});
exports.setGlobalError = globalErrorSlice.actions.setGlobalError;
exports.reducer = globalErrorSlice.reducer;
var getGlobalError = function (state) { return state.globalError.value; };
exports.getGlobalError = getGlobalError;
