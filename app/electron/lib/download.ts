import axios from 'axios';
import moment from 'moment';
import { queue } from 'async';
import iconv from 'iconv-lite';
import path from 'path';
import fs from 'fs';
import log from 'electron-log';

let startTime = '';
let targetDirPath = '';
let topic = '12736899';
let picTargetFilePath = '';
let videoTargetFilePath = '';
const csvEncoding = 'GB2312';
const queueLimit = 5;
let offset = '';

let topicNewUrl = '';
let topicHistoryUrl = '';

let errorCount = 0;
const picTopicInfos: { [key: string]: any }[] = [];
const videoTopicInfos: { [key: string]: any }[] = [];
const countMap: { [key: string]: number } = {};
let lock = false;

async function delay() {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
}

async function getCards(url: string) {
  try {
    const res: any = await axios({
      url,
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36',
      },
    });
    if (res.data.code !== 0) {
      throw new Error(`${res.msg}_${res.message}`);
    }
    const cards = res.data.data.cards;
    errorCount = 0;
    return cards;
  } catch (err) {
    errorCount++;
    if (errorCount > 5) {
      throw err;
    } else {
      console.log(err);
      await delay();
      await getCards(url);
    }
  }
}

async function downloadPic(url: string, fileNameBase: string) {
  const extname = path.extname(url);
  let numb = 0;
  if (countMap[fileNameBase]) {
    numb = countMap[fileNameBase];
  }
  countMap[fileNameBase] = numb + 1;
  const fileName = `${fileNameBase}${numb ? '-' + ('' + numb).padStart(3, '0') : ''}${extname}`;
  const localPath = path.join(targetDirPath, fileName);
  if (fs.existsSync(localPath)) {
    await fs.promises.rm(localPath);
  }
  const writer = fs.createWriteStream(localPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  response.data.pipe(writer);
  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  return fileName;
}

async function processCardInfo(cardInfo: any) {
  const { desc, card: cardJson } = cardInfo;
  const userInfo = desc.user_profile.info;
  const dynamicTime: number = desc.timestamp;
  const dynamicIdStr: string = desc.dynamic_id_str;
  const type = desc.type;
  const card = JSON.parse(cardJson);
  if (type === 8) {
    // 视频投稿
    const pic = card.pic;
    const nickname = userInfo.uname;
    const ctime = moment(dynamicTime * 1000).format('yyyy-MM-DD');
    const videoTopicInfo: { [key: string]: any } = {
      uid: userInfo.uid,
      nickname,
      dynamic: card.dynamic.replace(/\n/g, '\\n').slice(0, 100),
      ctime,
      videoPath: card.short_link,
      dynamicPath: `https://t.bilibili.com/${dynamicIdStr}?tab=2`,
      picRemotePath: pic,
      view: card.stat.view,
    };
    const fileNamebase = `${nickname}-${ctime}`;
    const localPathName = await downloadPic(pic, fileNamebase);
    videoTopicInfo.picLocalPath = localPathName;
    videoTopicInfos.push(videoTopicInfo);
  } else if (type === 2) {
    // 文字动态
    const nickname = userInfo.uname;
    const ctime = moment(dynamicTime * 1000).format('yyyy-MM-DD');
    const picRemotePath = [];
    const picLocalPath = [];
    const picTopicInfo: { [key: string]: any } = {
      uid: userInfo.uid,
      nickname,
      dynamic: card.item.description.replace(/\n/g, '\\n').slice(0, 100),
      ctime,
      dynamicPath: `https://t.bilibili.com/${dynamicIdStr}?tab=2`,
    };

    for (const picture of card.item.pictures) {
      const url = picture.img_src;
      picRemotePath.push(url);
      const fileNamebase = `${nickname}-${ctime}`;
      const localPathName = await downloadPic(url, fileNamebase);
      picLocalPath.push(localPathName);
    }
    picTopicInfo.picRemotePath = picRemotePath;
    picTopicInfo.picLocalPath = picLocalPath;
    picTopicInfos.push(picTopicInfo);
  } else if (type === 16) {
    // 小视频
  } else if (type === 1) {
    // 转发
  } else if (type === 64) {
    // 专栏
  } else {
    console.log(type, card);
  }
}

async function writePicInfos() {
  const data = [];
  data.push('uid,昵称,动态文字内容,动态发布时间,动态地址,图片地址,本地地址');
  picTopicInfos.forEach((item) => {
    for (const key in item.picRemotePath)
      if (key === '0') {
        data.push(
          [
            item.uid,
            item.nickname,
            item.dynamic,
            item.ctime,
            item.dynamicPath,
            item.picRemotePath[0],
            item.picLocalPath[0],
          ]
            .map((item) => `"${item}"`)
            .join(',')
        );
      } else {
        data.push(
          ['', '', '', '', '', item.picRemotePath[key], item.picLocalPath[key]]
            .map((item) => `"${item}"`)
            .join(',')
        );
      }
  });
  const csv = iconv.encode(data.join('\n'), csvEncoding);
  fs.writeFileSync(picTargetFilePath, csv);
}

async function writeVideoInfos() {
  const data = [];
  data.push('uid,昵称,动态文字内容,动态发布时间,动态地址,视频地址,封面地址,封面本地地址,播放量');
  videoTopicInfos
    .sort((a, b) => b.view - a.view)
    .forEach((item) => {
      data.push(
        [
          item.uid,
          item.nickname,
          item.dynamic,
          item.ctime,
          item.dynamicPath,
          item.videoPath,
          item.picRemotePath,
          item.picLocalPath,
          item.view,
        ]
          .map((item) => `"${item}"`)
          .join(',')
      );
    });
  const csv = iconv.encode(data.join('\n'), csvEncoding);
  fs.writeFileSync(videoTargetFilePath, csv);
}

async function init() {
  const res = fs.existsSync(targetDirPath);
  if (!res) {
    fs.mkdirSync(targetDirPath);
  }
  picTargetFilePath = path.join(targetDirPath, 'pic.csv');
  videoTargetFilePath = path.join(targetDirPath, 'video.csv');
  topicNewUrl = `https://api.vc.bilibili.com/topic_svr/v1/topic_svr/topic_new?topic_id=${topic}`;
  topicHistoryUrl = `https://api.vc.bilibili.com/topic_svr/v1/topic_svr/topic_history?topic_id=${topic}&offset_dynamic_id=`;
}

async function deal() {
  await init();
  const startTimestamp = moment(startTime).unix();
  const q = queue(processCardInfo, queueLimit);
  try {
    while (1) {
      let url = '';
      if (offset) {
        url = `${topicHistoryUrl}${offset}`;
      } else {
        url = topicNewUrl;
      }
      const cards = await getCards(url);
      let lastTimestamp: number = 0;
      let lastDynamicId: string = '';
      let count = 0;
      for (const item of cards) {
        if (item.desc.timestamp >= startTimestamp) {
          count++;
          q.push(item);
        }
        lastTimestamp = item.desc.timestamp;
        lastDynamicId = item.desc.dynamic_id_str;
      }
      if (count > 0) {
        await q.drain();
      }
      if (lastTimestamp < startTimestamp) {
        await q.kill();
        break;
      }
      offset = lastDynamicId;
    }
  } catch (err) {
    console.log(err, `异常退出 offset:${offset}`);
  }
  await writePicInfos();
  await writeVideoInfos();
}

export default async (start: string, topicId: string, target: string) => {
  if (lock) {
    return;
  }
  try {
    lock = true;
    offset = '';
    startTime = start;
    topic = topicId || '12736899';
    targetDirPath = target;
    await deal();
  } catch (err) {
    log.error(err);
  } finally {
    lock = false;
  }
};