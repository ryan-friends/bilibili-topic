import moment from 'moment';
import { queue } from 'async';
import iconv from 'iconv-lite';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { DynamicType, PictureInfo, VideoInfo } from '../lib/constant';
// import axiosRetry from 'axios-retry';
import { TopicV1 } from './topic/topicv1';
import TopicBase from './topic/base';
import { TopicV2 } from './topic/topicV2';
import { TopicName } from './topic/topicName';
import { TopicSignalType } from '@/common/const';
import { Config } from '@/common/interface';

interface DownloadInfo {
  url: string;
  localPath: string;
  retryTime: number;
}

export class DownloadTask {
  private readonly videoCoverDir;
  private readonly pictureDir;
  private readonly baseDir;
  private readonly csvEncoding = 'GB2312';
  private readonly queueLimit = 5;
  private readonly failSet;
  private readonly queue;
  private readonly pictureTopicInfos: PictureInfo[] = [];
  private readonly videoTopicInfos: VideoInfo[] = [];
  constructor(config: Config) {
    this.failSet = new Set<string>();
    this.baseDir = config.target;
    if (config.isSplitDiffType) {
      this.videoCoverDir = path.join(config.target, '视频封面');
      this.pictureDir = path.join(config.target, '图片');
    } else {
      this.videoCoverDir = config.target;
      this.pictureDir = config.target;
    }
    this.queue = queue<DownloadInfo>(this.download.bind(this), this.queueLimit);
  }

  public async run(data: Array<VideoInfo | PictureInfo>) {
    if (data.length < 1) {
      return;
    }
    await this.init();

    for (const item of data) {
      if (item.type === DynamicType.Picture) {
        this.queue.push(
          item.picFileName.map((picFileName, index) => ({
            url: item.picRemotePath[index],
            localPath: path.join(this.pictureDir, picFileName),
            retryTime: 0,
          }))
        );
        this.pictureTopicInfos.push(item);
      } else if (item.type === DynamicType.Video) {
        this.queue.push({
          url: item.picRemotePath,
          localPath: path.join(this.videoCoverDir, item.picFileName),
          retryTime: 0,
        });
        this.videoTopicInfos.push(item);
      }
    }
    await this.queue.drain();
    await this.queue.kill();
    await this.writePicInfos();
    await this.writeVideoInfos();
  }

  private async init() {
    for (const dir of Array.from(new Set([this.baseDir, this.pictureDir, this.videoCoverDir]))) {
      const res = fs.existsSync(dir);
      if (!res) {
        fs.mkdirSync(dir, {
          recursive: true,
        });
      }
    }
  }

  private async download({ url, localPath, retryTime }: DownloadInfo) {
    console.log('download', localPath);
    const source = axios.CancelToken.source();
    const timeout = setTimeout(() => {
      source.cancel();
      console.log('Aborted');
    }, 120000);
    try {
      if (fs.existsSync(localPath)) {
        await fs.promises.rm(localPath);
      }
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 5000,
        cancelToken: source.token,
      });
      clearTimeout(timeout);
      await fs.promises.writeFile(localPath, response.data);
      console.log('download finish', localPath);
    } catch (error) {
      console.log(error);
      if (fs.existsSync(localPath)) {
        await fs.promises.rm(localPath);
      }
      // this.failSet.add(url);
      if (retryTime < 2) {
        this.queue.push({ url, localPath, retryTime: retryTime + 1 });
      } else {
        this.failSet.add(url);
      }
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  private async writePicInfos() {
    const data = [];
    data.push('uid,昵称,动态文字内容,动态发布时间,动态地址,图片地址,本地地址,下载状态');
    this.pictureTopicInfos.forEach((item) => {
      for (const key in item.picRemotePath)
        if (key === '0') {
          data.push(
            [
              item.uid,
              item.nickname,
              item.dynamicText,
              item.createDate,
              item.dynamicPath,
              item.picRemotePath[0],
              path.join(this.pictureDir, item.picFileName[0]),
              this.failSet.has(item.picRemotePath[0]) ? '下载失败' : '完成',
            ]
              .map((item) => `"${item}"`)
              .join(',')
          );
        } else {
          data.push(
            [
              '',
              '',
              '',
              '',
              '',
              item.picRemotePath[key],
              path.join(this.pictureDir, item.picFileName[key]),
              this.failSet.has(item.picRemotePath[key]) ? '下载失败' : '完成',
            ]
              .map((item) => `"${item}"`)
              .join(',')
          );
        }
    });
    const csv = iconv.encode(data.join('\n'), this.csvEncoding);
    fs.writeFileSync(path.join(this.baseDir, '图片.csv'), csv);
  }

  private async writeVideoInfos() {
    const data = [];
    data.push('uid,昵称,动态文字内容,动态发布时间,动态地址,视频地址,封面地址,封面本地地址,播放量,下载状态');
    this.videoTopicInfos
      .sort((a, b) => b.view - a.view)
      .forEach((item) => {
        data.push(
          [
            item.uid,
            item.nickname,
            item.dynamicText,
            item.createDate,
            item.dynamicPath,
            item.videoPath,
            item.picRemotePath,
            path.join(this.videoCoverDir, item.picFileName),
            item.view,
            this.failSet.has(item.picRemotePath) ? '下载失败' : '完成',
          ]
            .map((item) => `"${item}"`)
            .join(',')
        );
      });
    const csv = iconv.encode(data.join('\n'), this.csvEncoding);
    fs.writeFileSync(path.join(this.baseDir, '视频.csv'), csv);
  }
}

let locker = false;

export default async (config: Config) => {
  try {
    if (locker) {
      return;
    }
    locker = true;
    const dict: {
      [type in TopicSignalType]: { new (topicSignal: string | number, startTimestamp: number): TopicBase };
    } = {
      [TopicSignalType.TopicV1]: TopicV1,
      [TopicSignalType.TopicV2]: TopicV2,
      [TopicSignalType.TopicName]: TopicName,
    };

    const topic = new dict[config.topicSignalType](config.topic, moment(config.start).unix());
    const info = await topic.getInfos();
    const task = new DownloadTask(config);
    await task.run(info);
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    locker = false;
  }
};
