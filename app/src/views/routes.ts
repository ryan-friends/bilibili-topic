const routes: RouteConfig[] = [
  {
    key: 'Home',
    path: '/',
    redirect: { to: '/main' },
    windowOptions: {
      title: 'bilibili topic',
      width: 600,
      height: 400,
      minWidth: 420,
      minHeight: 400,
    },
    createConfig: {
      showSidebar: false,
      saveWindowBounds: true,
      // openDevTools: true,
    },
  },
];

export default routes;
