"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var testUtils_1 = require("../testUtils");
var constants_1 = require("../constants");
var utils_1 = require("../utils");
var topBar_1 = require("./topBar");
Object.defineProperty(constants_1.Constants, 'versionString', { value: '1.0.0' });
jest.mock('../utils');
var mockedUtils = jest.mocked(utils_1.Utils, true);
describe('src/components/topBar', function () {
    beforeEach(jest.resetAllMocks);
    test('should match snapshot for focalboardPlugin', function () {
        mockedUtils.isFocalboardPlugin.mockReturnValue(true);
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<topBar_1["default"] />)).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot for none focalboardPlugin', function () {
        mockedUtils.isFocalboardPlugin.mockReturnValue(false);
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<topBar_1["default"] />)).container;
        expect(container).toMatchSnapshot();
    });
});
