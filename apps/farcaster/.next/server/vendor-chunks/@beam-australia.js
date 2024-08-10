"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/@beam-australia";
exports.ids = ["vendor-chunks/@beam-australia"];
exports.modules = {

/***/ "(ssr)/../../node_modules/@beam-australia/react-env/dist/index.js":
/*!******************************************************************!*\
  !*** ../../node_modules/@beam-australia/react-env/dist/index.js ***!
  \******************************************************************/
/***/ ((module) => {

eval("\n\nfunction isBrowser() {\n  return Boolean(typeof window !== \"undefined\" && window.__ENV);\n}\n\nfunction getFiltered() {\n  const prefix = process.env.REACT_ENV_PREFIX || 'REACT_APP';\n  return Object.keys(process.env)\n    .filter((key) => new RegExp(`^${prefix}_`, 'i').test(key))\n    .reduce((env, key) => {\n      env[key] = process.env[key];\n      return env;\n    }, {});\n}\n\nfunction env(key = \"\") {\n  const prefix = (isBrowser() ? window.__ENV['REACT_ENV_PREFIX'] : process.env.REACT_ENV_PREFIX) || 'REACT_APP';\n  const safeKey = `${prefix}_${key}`;\n  if (isBrowser()) {\n    return key.length ? window.__ENV[safeKey] : window.__ENV;\n  }\n  return key.length ? process.env[safeKey] : getFiltered();\n}\n\nmodule.exports = env;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzL0BiZWFtLWF1c3RyYWxpYS9yZWFjdC1lbnYvZGlzdC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBYTs7QUFFYjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esb0NBQW9DLE9BQU87QUFDM0M7QUFDQTtBQUNBO0FBQ0EsS0FBSyxJQUFJO0FBQ1Q7O0FBRUE7QUFDQTtBQUNBLHFCQUFxQixPQUFPLEdBQUcsSUFBSTtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZmFyY2FzdGVyLy4uLy4uL25vZGVfbW9kdWxlcy9AYmVhbS1hdXN0cmFsaWEvcmVhY3QtZW52L2Rpc3QvaW5kZXguanM/NTNiYyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGlzQnJvd3NlcigpIHtcbiAgcmV0dXJuIEJvb2xlYW4odHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cuX19FTlYpO1xufVxuXG5mdW5jdGlvbiBnZXRGaWx0ZXJlZCgpIHtcbiAgY29uc3QgcHJlZml4ID0gcHJvY2Vzcy5lbnYuUkVBQ1RfRU5WX1BSRUZJWCB8fCAnUkVBQ1RfQVBQJztcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHByb2Nlc3MuZW52KVxuICAgIC5maWx0ZXIoKGtleSkgPT4gbmV3IFJlZ0V4cChgXiR7cHJlZml4fV9gLCAnaScpLnRlc3Qoa2V5KSlcbiAgICAucmVkdWNlKChlbnYsIGtleSkgPT4ge1xuICAgICAgZW52W2tleV0gPSBwcm9jZXNzLmVudltrZXldO1xuICAgICAgcmV0dXJuIGVudjtcbiAgICB9LCB7fSk7XG59XG5cbmZ1bmN0aW9uIGVudihrZXkgPSBcIlwiKSB7XG4gIGNvbnN0IHByZWZpeCA9IChpc0Jyb3dzZXIoKSA/IHdpbmRvdy5fX0VOVlsnUkVBQ1RfRU5WX1BSRUZJWCddIDogcHJvY2Vzcy5lbnYuUkVBQ1RfRU5WX1BSRUZJWCkgfHwgJ1JFQUNUX0FQUCc7XG4gIGNvbnN0IHNhZmVLZXkgPSBgJHtwcmVmaXh9XyR7a2V5fWA7XG4gIGlmIChpc0Jyb3dzZXIoKSkge1xuICAgIHJldHVybiBrZXkubGVuZ3RoID8gd2luZG93Ll9fRU5WW3NhZmVLZXldIDogd2luZG93Ll9fRU5WO1xuICB9XG4gIHJldHVybiBrZXkubGVuZ3RoID8gcHJvY2Vzcy5lbnZbc2FmZUtleV0gOiBnZXRGaWx0ZXJlZCgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVudjtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/@beam-australia/react-env/dist/index.js\n");

/***/ })

};
;