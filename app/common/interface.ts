import { TopicSignalType } from "./const";

export interface Config {
  start: string;
  topic: string;
  target: string;
  topicSignalType: TopicSignalType;
  isSplitDiffType: boolean;
}
