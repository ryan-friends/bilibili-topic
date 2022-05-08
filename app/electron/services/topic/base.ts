import { PictureInfo, VideoInfo } from '@/electron/lib/constant';
import { get } from '../../lib/request';

export default abstract class Base {
  protected fileSuffixMap = new Map<string, number>();
  protected topicSignal: string | number;
  protected startTimestamp: number;

  constructor(topicSignal: string | number, startTimestamp: number) {
    this.topicSignal = topicSignal;
    this.startTimestamp = startTimestamp;
  }

  protected abstract getFirstPageUrl(): string;
  protected abstract getNextPageUrl(offset: string): string;
  protected abstract dealCardInfo(cardInfo: any): VideoInfo | PictureInfo | undefined;
  protected abstract dealResponseData(
    data: any
  ): { hasMore: boolean; list: any[]; offset: string; reachStart: boolean };
  public async getInfos(): Promise<Array<VideoInfo | PictureInfo>> {
    let offset = '';
    let reachStart = false;
    let hasMore = false;
    this.fileSuffixMap.clear();
    const data: Array<VideoInfo | PictureInfo> = [];
    do {
      let url = '';
      if (offset) {
        url = this.getNextPageUrl(offset);
      } else {
        url = this.getFirstPageUrl();
      }
      const responseData = await get(url);
      const dealtData = this.dealResponseData(responseData);
      hasMore = dealtData.hasMore;
      offset = dealtData.offset;
      reachStart = dealtData.reachStart;
      for (const item of dealtData.list) {
        const info = this.dealCardInfo(item);
        if (info) {
          data.push(info);
        }
      }
    } while (hasMore && !reachStart);
    return data;
  }
}
