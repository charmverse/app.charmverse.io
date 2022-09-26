"use strict";
exports.__esModule = true;
exports.getCardComments = exports.reducer = exports.updateComments = void 0;
var toolkit_1 = require("@reduxjs/toolkit");
var initialLoad_1 = require("./initialLoad");
var commentsSlice = (0, toolkit_1.createSlice)({
    name: 'comments',
    initialState: { comments: {} },
    reducers: {
        updateComments: function (state, action) {
            for (var _i = 0, _a = action.payload; _i < _a.length; _i++) {
                var comment = _a[_i];
                if (comment.deletedAt === 0) {
                    state.comments[comment.id] = comment;
                }
                else {
                    delete state.comments[comment.id];
                }
            }
        }
    },
    extraReducers: function (builder) {
        builder.addCase(initialLoad_1.initialReadOnlyLoad.fulfilled, function (state, action) {
            state.comments = {};
            for (var _i = 0, _a = action.payload; _i < _a.length; _i++) {
                var block = _a[_i];
                if (block.type === 'comment') {
                    state.comments[block.id] = block;
                }
            }
        });
        builder.addCase(initialLoad_1.initialLoad.fulfilled, function (state, action) {
            state.comments = {};
            for (var _i = 0, _a = action.payload.blocks; _i < _a.length; _i++) {
                var block = _a[_i];
                if (block.type === 'comment') {
                    state.comments[block.id] = block;
                }
            }
        });
    }
});
exports.updateComments = commentsSlice.actions.updateComments;
exports.reducer = commentsSlice.reducer;
function getCardComments(cardId) {
    return function (state) {
        return cardId ? Object.values(state.comments.comments)
            .filter(function (c) { return c.parentId === cardId; })
            .sort(function (a, b) { return a.createdAt - b.createdAt; }) : [];
    };
}
exports.getCardComments = getCardComments;
// optimized version. see: https://react-redux.js.org/api/hooks
// export function getCardCommentsMemoFriendly (): (state: RootState, cardId: string) => CommentBlock[] {
//     return createDeepEqualSelector(
//         (state: RootState) => state.comments.comments,
//         (_: RootState, cardId: string) => cardId,
//         (comments, cardId: string): CommentBlock[] => {
//             return Object.values(comments).
//                 filter((c) => c.parentId === cardId).
//                 sort((a, b) => a.createdAt - b.createdAt)
//         }
//     )
// }
