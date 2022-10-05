
import { fontFamily } from 'theme';
import { blackColor, blueColor, greyColor, greyColor2, lightGreyColor } from 'theme/colors';

export const css = `

  h1, h2, h3, h4, h5, h6, li, p {
    line-height: 1.2em;
    margin-top: 0;
  }

  h1 {
    font-size: 32px;
  }

  h2 {
    font-size: 24px;
  }

  .mjml-divider {
    padding-top: 40px;
    padding-bottom: 40px;
  }

  .mjml-divider p {
    border-top: 2px solid #eee !important;
  }

  a, a:visited {
    color: ${blueColor};
    text-decoration: none;
  }

  ul {
    margin-left: 0;
    padding-left: 0;
  }

  li {
    margin-left: 0;
    margin-top: 6px;
    padding: 10px 10px 10px 0;
    border-top: 2px solid #eee;
    list-style: none;
  }

  hr {
    border: 1px solid ${lightGreyColor};
    margin: 6px 0;
  }

  .nowrap div {
    white-space: nowrap;
  }

  .button {
    border-radius: 4px;
  }

  a.button, .button a {
    border: none;
    color: #111;
    font-family: ${fontFamily} !important;
    font-size: 18px !important;
    font-weight: 600 !important;
    padding: 10px 30px !important;
    background: ${blueColor} !important;
    text-decoration: underline;
  }

  .button.button-small {
    font-size: 12px;
    padding: 8px 16px;
  }

  .button.float-right {
    float: right;
    margin-top: 4px;
  }

  .button-outline {
    background: white;
    display: block;
    color: ${greyColor};
    border: 1px solid ${greyColor};
    border-radius: 2px;
    line-height: 26px;
    margin: 0 auto;
    width: 80px;
  }

  .black-background {
    background-color: ${blackColor};
    ${/* hack for gmail dark mode: https://www.hteumeuleu.com/2021/fixing-gmail-dark-mode-css-blend-modes/ */ ''}
    background-image: linear-gradient(${blackColor}, ${blackColor});
  }

  .footer p {
    color: ${greyColor2};
    font-size: 11px;
  }
  .footer a {
    color: ${greyColor2};
    text-decoration: underline;
  }
`;

export default css;
