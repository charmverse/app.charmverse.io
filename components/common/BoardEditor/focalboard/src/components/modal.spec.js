"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var react_2 = require("react");
var testUtils_1 = require("../testUtils");
var modal_1 = require("./modal");
describe('components/modal', function () {
    beforeAll(testUtils_1.mockDOM);
    beforeEach(jest.clearAllMocks);
    test('should match snapshot', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<modal_1["default"] onClose={jest.fn()}>
        <div id='test'/>
      </modal_1["default"]>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return Modal and close', function () {
        var onMockedClose = jest.fn();
        (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<modal_1["default"] onClose={onMockedClose}>
        <div id='test'/>
      </modal_1["default"]>));
        var buttonClose = react_1.screen.getByRole('button', { name: 'Close' });
        user_event_1["default"].click(buttonClose);
        expect(onMockedClose).toBeCalledTimes(1);
    });
    test('return Modal on position top', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<modal_1["default"] position='top' onClose={jest.fn()}>
        <div id='test'/>
      </modal_1["default"]>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return Modal on position bottom', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<modal_1["default"] position='bottom' onClose={jest.fn()}>
        <div id='test'/>
      </modal_1["default"]>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return Modal on position bottom-right', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<modal_1["default"] position='bottom-right' onClose={jest.fn()}>
        <div id='test'/>
      </modal_1["default"]>)).container;
        expect(container).toMatchSnapshot();
    });
});
