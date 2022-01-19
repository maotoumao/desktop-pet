/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { URL } from 'url';
import path from 'path';

export let resolveHtmlPath: (
  htmlFileName: string,
  hashRoute?: string,
  query?: { [k: string]: any }
) => string;

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 1212;
  resolveHtmlPath = (
    htmlFileName: string,
    hashRoute?: string,
    query?: { [k: string]: any }
  ) => {
    const url = new URL(
      `http://localhost:${port}${hashRoute ? `#${hashRoute}` : ''}`
    );
    if (query) {
      for (const k in query) {
        url.searchParams.append(k, query[k]);
      }
    }
    url.pathname = htmlFileName;
    return url.href;
  };
} else {
  resolveHtmlPath = (
    htmlFileName: string,
    hashRoute?: string,
    query?: { [k: string]: any }
  ) => {
    let queryStr = '';
    if (query) {
      queryStr = `?${Object.entries(query)
        .map(([k, v]) => `${k}=${v}`)
        .join('&')}`;
    }
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}${
      hashRoute ? `#${hashRoute}` : ''
    }`;
  };
}
