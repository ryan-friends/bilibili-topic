import { app } from 'electron';
import Store from 'electron-store';
import moment from 'moment';
import path from 'path';

const store = new Store();

export const saveConfig = (config: { start: string; topic: string; target: string }) => {
  store.set(config);
};

export const getConfig = () => {
  const start = store.get('start', moment().subtract(7, 'days').format('YYYY-MM-DD'));
  const topic = store.get('topic', '12736899');
  const target = store.get('target', path.join(app.getAppPath(), 'download'));
  return {
    start,
    topic,
    target,
  };
};
