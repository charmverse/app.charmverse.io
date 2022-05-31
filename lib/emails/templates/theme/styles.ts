
import { blackColor, blueColor, greyColor, greyColor2, lightGreyColor } from 'theme/colors';

export const css = `

  h1, h2, h3, h4, h5, h6, li, p {
    color: ${greyColor};
    line-height: 1.4em;
  }

  h3 {
    font-size: 12px;
  }

  h3 {
    letter-spacing: 1px;
    text-transform: uppercase;
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
    border-radius: 2px;
  }

  a.button {
    border: none;
    color: #111;
    padding: 10px 25px;
    background: ${blueColor};
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
