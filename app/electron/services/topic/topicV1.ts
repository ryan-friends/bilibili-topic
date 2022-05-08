import { DynamicType, PictureInfo, VideoInfo } from '@/electron/lib/constant';
import moment from 'moment';
import path from 'path';
import Base from './base';

export class TopicV1 extends Base {
  protected dealCardInfo(cardInfo: any): VideoInfo | PictureInfo | undefined {
    const { desc, card: cardJson } = cardInfo;
    if (this.startTimestamp && desc.timestamp < this.startTimestamp) {
      return;
    }
    const userInfo = desc.user_profile.info;
    const dynamicTime: number = desc.timestamp;
    const dynamicIdStr: string = desc.dynamic_id_str;
    const type = desc.type;
    const card = JSON.parse(cardJson);
    if (type === 8) {
      // 视频投稿
      const pic = card.pic;
      const nickname = userInfo.uname;
      const createDate = moment(dynamicTime * 1000).format('yyyy-MM-DD');
      let picFileName = `${nickname}-${createDate}`;
      const suffix = this.fileSuffixMap.get(picFileName) || 0;
      this.fileSuffixMap.set(picFileName, suffix + 1);
      if (suffix) {
        picFileName = `${picFileName}-${suffix}`;
      }
      const videoTopicInfo: VideoInfo = {
        type: DynamicType.Video,
        uid: userInfo.uid,
        nickname,
        dynamicText: card.dynamic.replace(/\n/g, '\\n').slice(0, 100),
        createDate,
        videoPath: card.short_link,
        dynamicPath: `https://t.bilibili.com/${dynamicIdStr}?tab=2`,
        picRemotePath: pic,
        picFileName: `${picFileName}${path.extname(pic)}`,
        view: card.stat.view,
      };
      return videoTopicInfo;
    } else if (type === 2) {
      // 图片动态
      if (!card.item.pictures || !card.item.pictures.length) {
        return;
      }
      const nickname = userInfo.uname;
      const createDate = moment(dynamicTime * 1000).format('yyyy-MM-DD');
      const picTopicInfo: PictureInfo = {
        type: DynamicType.Picture,
        uid: userInfo.uid,
        nickname,
        dynamicText: card.item.description.replace(/\n/g, '\\n').slice(0, 100),
        createDate,
        dynamicPath: `https://t.bilibili.com/${dynamicIdStr}?tab=2`,
        picRemotePath: [],
        picFileName: [],
      };
      const fileNamebase = `${nickname}-${createDate}`;
      let suffix = this.fileSuffixMap.get(fileNamebase) || 0;
      for (const picture of card.item.pictures) {
        const url = picture.img_src;
        picTopicInfo.picRemotePath.push(url);
        let picFileName = fileNamebase;
        if (suffix) {
          picFileName = `${picFileName}-${suffix}`;
        }
        suffix += 1;
        picTopicInfo.picFileName.push(`${picFileName}${path.extname(url)}`);
      }
      this.fileSuffixMap.set(fileNamebase, suffix);
      return picTopicInfo;
    } else if (type === 16) {
      // 小视频
    } else if (type === 1) {
      // 转发
    } else if (type === 64) {
      // 专栏
    } else {
      console.log(type, card);
    }
    return;
  }

  protected dealResponseData(
    data: any
  ): { hasMore: boolean; list: any[]; offset: string; reachStart: boolean } {
    return {
      hasMore: data.has_more,
      list: data.cards,
      offset: data.offset,
      reachStart:
        data.cards.length > 0 ? data.cards[data.cards.length - 1].desc.timestamp < this.startTimestamp : true,
    };
  }

  protected getFirstPageUrl(): string {
    return `https://api.vc.bilibili.com/topic_svr/v1/topic_svr/topic_new?topic_id=${this.topicSignal}`;
  }
  protected getNextPageUrl(offset: string): string {
    return `https://api.vc.bilibili.com/topic_svr/v1/topic_svr/topic_history?topic_id=${this.topicSignal}&offset_dynamic_id=${offset}`;
  }
}
