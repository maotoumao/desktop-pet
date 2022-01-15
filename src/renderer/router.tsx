import Main from './pages/main';

interface IRoute {
  path: string;
  element: JSX.Element;
  key?: string;
}

const routes: IRoute[] = [
  {
    path: '/',
    element: <Main />,
    key: 'main',
  },
];

// 不同的pages代表不同的页面，以实现多窗口
export default routes;
