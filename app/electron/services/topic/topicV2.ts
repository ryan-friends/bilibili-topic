import { DynamicType, PictureInfo, VideoInfo } from '@/electron/lib/constant';
import moment from 'moment';
import path from 'path';
import Base from './base';

export class TopicV2 extends Base {
  protected dealCardInfo(cardInfo: any): VideoInfo | PictureInfo | undefined {
    const card = cardInfo.dynamic_card_item;
    const { id_str: dynamicIdStr, type, modules } = card;
    const authorInfo = modules.module_author;
    const uid = authorInfo.mid;
    const nickname = authorInfo.name;
    const createDate = moment(authorInfo.pub_ts * 1000).format('yyyy-MM-DD');
    if (type === 'DYNAMIC_TYPE_AV') {
      // 视频投稿
      let picFileName = `${nickname}-${createDate}`;
      const suffix = this.fileSuffixMap.get(picFileName) || 0;
      this.fileSuffixMap.set(picFileName, suffix + 1);
      const coverUrl = modules?.module_dynamic?.major?.archive?.cover;
      if (!coverUrl) {
        return;
      }
      if (suffix) {
        picFileName = `${picFileName}-${suffix}`;
      }
      const videoTopicInfo: VideoInfo = {
        type: DynamicType.Video,
        uid,
        nickname,
        dynamicText: modules?.module_dynamic?.major?.archive?.desc?.replace(/\n/g, '\\n').slice(0, 100) || '',
        createDate,
        videoPath: modules?.module_dynamic?.major?.archive?.jump_url || '',
        dynamicPath: `https://t.bilibili.com/${dynamicIdStr}?tab=2`,
        picRemotePath: coverUrl,
        picFileName: `${picFileName}${path.extname(coverUrl)}`,
        view: modules?.module_dynamic?.major?.archive?.stat?.play,
      };
      return videoTopicInfo;
    } else if (type === 'DYNAMIC_TYPE_DRAW') {
      // 图片动态
      if (!modules?.module_dynamic?.major?.draw) {
        return;
      }
      const picTopicInfo: PictureInfo = {
        type: DynamicType.Picture,
        uid,
        nickname,
        dynamicText: modules.module_dynamic.desc.text.replace(/\n/g, '\\n').slice(0, 100),
        createDate,
        dynamicPath: `https://t.bilibili.com/${dynamicIdStr}?tab=2`,
        picRemotePath: [],
        picFileName: [],
      };
      const fileNamebase = `${nickname}-${createDate}`;
      let suffix = this.fileSuffixMap.get(fileNamebase) || 0;
      for (const picture of modules.module_dynamic.major.draw.items) {
        const url = picture.src;
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
    } else if (type === 'DYNAMIC_TYPE_WORD') {
      // 文字动态
    } else if (type === 'DYNAMIC_TYPE_FORWARD') {
      // 转发
    } else {
      console.log(type, card);
    }
    return;
  }

  protected dealResponseData(
    data: any
  ): { hasMore: boolean; list: any[]; offset: string; reachStart: boolean } {
    const topicInfo = data.topic_card_list;
    let reachStart = true;
    if (topicInfo.items.length > 0) {
      const last = topicInfo.items[topicInfo.items.length - 1];
      const lastPubTime = last.dynamic_card_item.modules.module_author.pub_ts;
      reachStart = lastPubTime < this.startTimestamp;
    }

    return {
      hasMore: topicInfo.has_more,
      list: topicInfo.items,
      offset: topicInfo.offset,
      reachStart,
    };
  }

  protected getFirstPageUrl(): string {
    return `https://app.bilibili.com/x/topic/web/details/cards?topic_id=${this.topicSignal}&sort_by=3&page_size=20`;
  }
  protected getNextPageUrl(offset: string): string {
    return `https://app.bilibili.com/x/topic/web/details/cards?topic_id=${this.topicSignal}&offset=${offset}&sort_by=3&page_size=20`;
  }
}
