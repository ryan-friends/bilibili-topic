export enum DynamicType {
  Video = 1,
  Picture = 2,
}

export interface VideoInfo {
  uid: number;
  nickname: string;
  dynamicText: string;
  createDate: string;
  dynamicPath: string;
  videoPath: string;
  picRemotePath: string;
  picFileName: string;
  view: number;
  type: DynamicType.Video;
}

export interface PictureInfo {
  uid: number;
  nickname: string;
  dynamicText: string;
  createDate: string;
  dynamicPath: string;
  picRemotePath: string[];
  picFileName: string[];
  type: DynamicType.Picture;
}
