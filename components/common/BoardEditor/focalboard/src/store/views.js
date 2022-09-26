"use strict";
var _a;
exports.__esModule = true;
exports.getCurrentViewDisplayBy = exports.getCurrentViewGroupBy = exports.getCurrentView = exports.getCurrentBoardViews = exports.getView = exports.getSortedViews = exports.getViews = exports.reducer = exports.addView = exports.updateView = exports.setCurrent = exports.updateViews = void 0;
var toolkit_1 = require("@reduxjs/toolkit");
var boardView_1 = require("../blocks/boardView");
var boards_1 = require("./boards");
var initialLoad_1 = require("./initialLoad");
var viewsSlice = (0, toolkit_1.createSlice)({
    name: 'views',
    initialState: { views: {}, current: '' },
    reducers: {
        setCurrent: function (state, action) {
            state.current = action.payload;
        },
        addView: function (state, action) {
            state.views[action.payload.id] = action.payload;
        },
        updateViews: function (state, action) {
            for (var _i = 0, _a = action.payload; _i < _a.length; _i++) {
                var view = _a[_i];
                if (view.deletedAt === 0) {
                    state.views[view.id] = view;
                }
                else {
                    delete state.views[view.id];
                }
            }
        },
        updateView: function (state, action) {
            state.views[action.payload.id] = action.payload;
        }
    },
    extraReducers: function (builder) {
        builder.addCase(initialLoad_1.initialReadOnlyLoad.fulfilled, function (state, action) {
            state.views = {};
            for (var _i = 0, _a = action.payload; _i < _a.length; _i++) {
                var block = _a[_i];
                if (block.type === 'view') {
                    state.views[block.id] = block;
                }
            }
        });
        builder.addCase(initialLoad_1.initialLoad.fulfilled, function (state, action) {
            state.views = {};
            for (var _i = 0, _a = action.payload.blocks; _i < _a.length; _i++) {
                var block = _a[_i];
                if (block.type === 'view') {
                    state.views[block.id] = block;
                }
            }
        });
    }
});
exports.updateViews = (_a = viewsSlice.actions, _a.updateViews), exports.setCurrent = _a.setCurrent, exports.updateView = _a.updateView, exports.addView = _a.addView;
exports.reducer = viewsSlice.reducer;
var getViews = function (state) { return state.views.views; };
exports.getViews = getViews;
exports.getSortedViews = (0, toolkit_1.createSelector)(exports.getViews, function (views) {
    return Object.values(views).sort(function (a, b) { return a.title.localeCompare(b.title); }).map(function (v) { return (0, boardView_1.createBoardView)(v); });
});
function getView(viewId) {
    return function (state) {
        return state.views.views[viewId] || null;
    };
}
exports.getView = getView;
exports.getCurrentBoardViews = (0, toolkit_1.createSelector)(function (state) { return state.boards.current; }, exports.getViews, function (boardId, views) {
    return Object.values(views).filter(function (v) { return v.parentId === boardId; }).sort(function (a, b) { return a.title.localeCompare(b.title); }).map(function (v) { return (0, boardView_1.createBoardView)(v); });
});
exports.getCurrentView = (0, toolkit_1.createSelector)(exports.getViews, function (state) { return state.views.current; }, function (views, viewId) {
    return views[viewId];
});
exports.getCurrentViewGroupBy = (0, toolkit_1.createSelector)(boards_1.getCurrentBoard, exports.getCurrentView, function (currentBoard, currentView) {
    if (!currentBoard) {
        return undefined;
    }
    if (!currentView) {
        return undefined;
    }
    return currentBoard.fields.cardProperties.find(function (o) { return o.id === currentView.fields.groupById; });
});
exports.getCurrentViewDisplayBy = (0, toolkit_1.createSelector)(boards_1.getCurrentBoard, exports.getCurrentView, function (currentBoard, currentView) {
    if (!currentBoard) {
        return undefined;
    }
    if (!currentView) {
        return undefined;
    }
    return currentBoard.fields.cardProperties.find(function (o) { return o.id === currentView.fields.dateDisplayPropertyId; });
});
