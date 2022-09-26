"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
require("@testing-library/jest-dom");
var user_event_1 = require("@testing-library/user-event");
var testUtils_1 = require("../testUtils");
var flashMessages_1 = require("./flashMessages");
jest.mock('../mutator');
beforeEach(function () {
    jest.useFakeTimers();
});
afterEach(function () {
    jest.clearAllTimers();
});
describe('components/flashMessages', function () {
    test('renders a flash message with high severity', function () {
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<flashMessages_1.FlashMessages milliseconds={200}/>)).container;
        /**
             * Check for high severity
             */
        (0, react_2.act)(function () {
            (0, flashMessages_1.sendFlashMessage)({ content: 'Mock Content', severity: 'high' });
        });
        expect(container).toMatchSnapshot();
        (0, react_2.act)(function () {
            jest.advanceTimersByTime(200);
        });
        expect(react_2.screen.queryByText('Mock Content')).toBeNull();
    });
    test('renders a flash message with normal severity', function () {
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<flashMessages_1.FlashMessages milliseconds={200}/>)).container;
        (0, react_2.act)(function () {
            (0, flashMessages_1.sendFlashMessage)({ content: 'Mock Content', severity: 'normal' });
        });
        expect(react_2.screen.getByText('Mock Content')).toHaveClass('normal');
        expect(container).toMatchSnapshot();
        (0, react_2.act)(function () {
            jest.advanceTimersByTime(200);
        });
        expect(react_2.screen.queryByText('Mock Content')).toBeNull();
    });
    test('renders a flash message with low severity', function () {
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<flashMessages_1.FlashMessages milliseconds={200}/>)).container;
        (0, react_2.act)(function () {
            (0, flashMessages_1.sendFlashMessage)({ content: 'Mock Content', severity: 'low' });
        });
        expect(react_2.screen.getByText('Mock Content')).toHaveClass('low');
        expect(container).toMatchSnapshot();
        (0, react_2.act)(function () {
            jest.advanceTimersByTime(200);
        });
        expect(react_2.screen.queryByText('Mock Content')).toBeNull();
    });
    test('renders a flash message with low severity and custom HTML in flash message', function () {
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<flashMessages_1.FlashMessages milliseconds={200}/>)).container;
        (0, react_2.act)(function () {
            (0, flashMessages_1.sendFlashMessage)({ content: <div data-testid='mock-test-id'>Mock Content</div>, severity: 'low' });
        });
        expect(react_2.screen.getByTestId('mock-test-id')).toBeVisible();
        expect(container).toMatchSnapshot();
        (0, react_2.act)(function () {
            jest.advanceTimersByTime(200);
        });
        expect(react_2.screen.queryByText('Mock Content')).toBeNull();
    });
    test('renders a flash message with low severity and check onClick on flash works', function () {
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<flashMessages_1.FlashMessages milliseconds={200}/>)).container;
        (0, react_2.act)(function () {
            (0, flashMessages_1.sendFlashMessage)({ content: 'Mock Content', severity: 'low' });
        });
        user_event_1["default"].click(react_2.screen.getByText('Mock Content'));
        expect(container).toMatchSnapshot();
        (0, react_2.act)(function () {
            jest.advanceTimersByTime(200);
        });
        expect(react_2.screen.queryByText('Mock Content')).toBeNull();
    });
});
