import { render } from 'mjml-react';
import type React from 'react';

export function renderMJML (mjml: React.ReactElement) {
  const { html: rendered } = render(mjml, {
    // see https://github.com/wix-incubator/mjml-react/issues/58
    minify: false
  });
  return rendered;
}
