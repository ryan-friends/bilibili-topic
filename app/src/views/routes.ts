const routes: RouteConfig[] = [
  {
    key: 'Home',
    path: '/',
    redirect: { to: '/main' },
    windowOptions: {
      title: 'bilibili topic',
      width: 800,
      height: 500,
      minWidth: 600,
      minHeight: 500,
    },
    createConfig: {
      showSidebar: false,
      saveWindowBounds: true,
      // openDevTools: true,
    },
  },
];

export default routes;
