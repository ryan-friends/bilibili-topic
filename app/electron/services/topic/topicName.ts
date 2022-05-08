import { TopicV1 } from './topicv1';

export class TopicName extends TopicV1 {
  protected getFirstPageUrl(): string {
    return `https://api.vc.bilibili.com/topic_svr/v1/topic_svr/topic_new?topic_name=${this.topicSignal}`;
  }
  protected getNextPageUrl(offset: string): string {
    return `https://api.vc.bilibili.com/topic_svr/v1/topic_svr/topic_history?topic_name=${this.topicSignal}&offset_dynamic_id=${offset}`;
  }
}
