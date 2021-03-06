/**
 * 页面资源集合，请不要在主进程中引用
 */

// 设为 undefined 将不会创建路由，一般用于重定向
export const Home = undefined;

export const Main = import('./views/main/main');
// export const PageParams = import('./views/demo/page-params');
// export const LogViewer = import('./views/log-viewer/log-viewer')

// export const NoMatch = import('./views/no-match/no-match')

// // 同步引用，注意这不会触发 beforeRouter
export { default as AlertModal } from './views/modals/alert-modal';
