import { app, BrowserWindowConstructorOptions } from 'electron';
import { asAssetsPath } from './paths';

/** 应用名称 */
export const APP_NAME = app.name;

/** 应用版本 */
export const APP_VERSION = app.getVersion();

/** 应用标题 */
export const APP_TITLE = 'Bilibili Topic';

/** 应用主图标 (桌面) */
export const APP_ICON = asAssetsPath('icon.png');

/** 创建新窗口时默认加载的选项 */
export const DEFAULT_WINDOW_OPTIONS: BrowserWindowConstructorOptions = {
  icon: APP_ICON,
  minWidth: 420,
  minHeight: 200,
  width: 800,
  height: 400,
  show: false,
  hasShadow: true,
  webPreferences: {
    contextIsolation: false,
    nodeIntegration: true,
    scrollBounce: true,
    enableRemoteModule: true,
  },
  titleBarStyle: 'hidden', // 隐藏标题栏, 但显示窗口控制按钮
  // frame: process.platform === 'darwin' ? true : false, // 无边框窗口
  frame: false, // 无边框窗口
  // skipTaskbar: false, // 是否在任务栏中隐藏窗口
  // backgroundColor: '#fff',
  // transparent: true, // 窗口是否透明
  // titleBarStyle: 'hidden',
  // vibrancy: 'fullscreen-ui', // 毛玻璃效果
};

export const DEFAULT_CREATE_CONFIG: CreateConfig = {
  showSidebar: false,
  showTitlebar: true,
  autoShow: true,
  delayToShow: 10,
  single: true,
};
