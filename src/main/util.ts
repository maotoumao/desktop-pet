/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { URL } from 'url';
import path from 'path';

export let resolveHtmlPath: (
  htmlFileName: string,
  hashRoute?: string
) => string;

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 1212;
  resolveHtmlPath = (htmlFileName: string, hashRoute?: string) => {
    const url = new URL(
      `http://localhost:${port}${hashRoute ? `#${hashRoute}` : ''}`
    );
    url.pathname = htmlFileName;
    return url.href;
  };
} else {
  resolveHtmlPath = (htmlFileName: string, hashRoute?: string) => {
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}${
      hashRoute ? `#${hashRoute}` : ''
    }`;
  };
}
