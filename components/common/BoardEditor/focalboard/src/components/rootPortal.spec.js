"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
require("@testing-library/jest-dom");
var rootPortal_1 = require("./rootPortal");
describe('components/RootPortal', function () {
    beforeEach(function () {
        // Quick fix to disregard console error when unmounting a component
        console.error = jest.fn();
    });
    test('should match snapshot', function () {
        var rootPortalDiv = document.createElement('div');
        rootPortalDiv.id = 'focalboard-root-portal';
        var _a = (0, react_2.render)(<rootPortal_1["default"]>
        <div>Testing Portal</div>
      </rootPortal_1["default"]>, { container: document.body.appendChild(rootPortalDiv) }), getByText = _a.getByText, container = _a.container;
        expect(getByText('Testing Portal')).toBeVisible();
        expect(container).toMatchSnapshot();
    });
});
