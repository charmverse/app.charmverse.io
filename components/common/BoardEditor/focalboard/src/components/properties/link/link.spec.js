"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
require("@testing-library/jest-dom");
var link_1 = require("./link");
describe('components/properties/link', function () {
    test('returns link properties correctly', function () {
        var component = (<link_1["default"] value='https://github.com/mattermost/focalboard' onChange={jest.fn()} onSave={jest.fn()} onCancel={jest.fn()} validator={jest.fn(function () {
                return true;
            })}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
});
