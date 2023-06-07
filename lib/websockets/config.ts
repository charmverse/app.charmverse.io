export const config = {
  addTrailingSlash: false, // fix for next.js https://github.com/vercel/next.js/issues/49334
  // increase the amount of data that can be sent to the server
  maxHttpBufferSize: 1e7 // set from 1e6 (1MB) to 1e7 (10Mb)
};
