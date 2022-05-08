import { TopicSignalType } from '@/common/const';
import { Config } from '@/common/interface';
import { app } from 'electron';
import Store from 'electron-store';
import moment from 'moment';
import path from 'path';

const store = new Store<Config>();

const DefaultConfig: Config = {
  start: moment().subtract(7, 'days').format('YYYY-MM-DD'),
  topic: '12736899',
  topicSignalType: TopicSignalType.TopicV1,
  target: path.join(app.getAppPath(), 'download'),
  isSplitDiffType: true,
};

export const saveConfig = (config: Config) => {
  store.set(config);
};

export const getConfig = (): Config => {
  const start = store.get('start', DefaultConfig.start);
  const topic = store.get('topic', DefaultConfig.topic);
  const target = store.get('target', DefaultConfig.target);
  const topicSignalType = store.get('topicSignalType', DefaultConfig.topicSignalType);
  const isSplitDiffType = store.get('isSplitDiffType', DefaultConfig.isSplitDiffType);
  return {
    start,
    topic,
    target,
    topicSignalType,
    isSplitDiffType,
  };
};
