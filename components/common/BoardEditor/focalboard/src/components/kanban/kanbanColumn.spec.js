"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var testUtils_1 = require("../../testUtils");
var kanbanColumn_1 = require("./kanbanColumn");
describe('src/components/kanban/kanbanColumn', function () {
    test('should match snapshot', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanColumn_1["default"] onDrop={jest.fn()}>
        
      </kanbanColumn_1["default"]>)).container;
        expect(container).toMatchSnapshot();
    });
});
