import { blueColor, greyColor } from 'theme/colors';

export const css = `
  .button {
    border-radius: 4px;
  }

  a.button, .button a {
    border: none;
    color: #111;
    font-family: var(--font-family-default) !important;
    font-size: 18px !important;
    font-weight: 600 !important;
    padding: 10px 30px !important;
    background: ${blueColor} !important;
    text-decoration: underline;
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
`;

export default css;
