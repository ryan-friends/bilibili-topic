/**
 * electron-builder configuration
 * https://www.electron.build/configuration/configuration
 */

import path from 'path';
import { Configuration, CliOptions } from 'electron-builder';
import buildConfig from './config';

const ICON_ICO = path.resolve(__dirname, '../assets/icon.ico');

const {
  npm_package_name: productName,
  npm_package_buildVersion: buildVersion,
  npm_package_appId: appId,
  npm_package_version: version,
} = process.env;

const config: Configuration = {
  productName,
  buildVersion,
  appId,
  files: ['dist', 'assets', 'package.json'],
  asar: false,
  directories: {
    buildResources: 'assets',
    output: path.join(buildConfig.release, `${productName}-release-${version}`),
  },
  win: {
    icon: ICON_ICO,
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
  },
  nsis: {
    oneClick: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    perMachine: true,
    shortcutName: 'bilibili topic',
  },
};

const packageConfig: CliOptions = {
  config,
};

export default packageConfig;
