import { TopicSignalType } from '@/common/const';
import { Button, Form, Input, DatePicker, message, FormInstance, Radio, Switch } from 'antd';
import { ipcRenderer, remote, shell } from 'electron';
import { Config } from 'electron/main';
import fs from 'fs';
import moment from 'moment';
import React from 'react';
import './main.less';

let key = 1;

const getConfig = async () => {
  try {
    const result = await ipcRenderer.invoke('main-event', 'getLastConfig');
    return result;
  } catch (err: any) {
    console.error(err);
    alert(err.message);
  }
};

const download = async (config: Config) => {
  try {
    await ipcRenderer.invoke('main-event', 'download', JSON.stringify(config));
  } catch (err: any) {
    console.error(err);
    alert(err.message);
  }
};

export default function Main() {
  const [data, setData] = React.useState({});
  const [isShow, setIsShow] = React.useState(false);
  const formRef = React.createRef<FormInstance>();
  React.useEffect(() => {
    getConfig()
      .then((data) => {
        setData({
          topic: data.topic,
          start: moment(data.start),
          target: data.target,
          topicSignalType: data.topicSignalType,
          isSplitDiffType: data.isSplitDiffType,
        });
        setIsShow(true);
      })
      .catch((err) => {
        // message.error(err.message);
      });
  }, []);

  const onFinish = async (values: any) => {
    const messageKey = `download-message-${key}`;
    key += 1;
    values.start = values.start.startOf('day');
    message.loading({
      content: '下载中',
      duration: 0,
      key: messageKey,
    });
    await download(values);
    message.destroy(messageKey);
    message.info('下载完成');
  };

  const onSetFolder = () => {
    remote.dialog.showOpenDialog({ properties: ['openDirectory'] }).then((result) => {
      const path = result.filePaths[0];
      if (path) {
        formRef.current?.setFields([{ name: 'target', value: path }]);
      }
    });
  };

  const onOpenFolder = () => {
    const path = formRef.current?.getFieldValue('target');
    const res = fs.existsSync(path);
    if (!res) {
      fs.mkdirSync(path);
    }
    shell.openPath(path);
  };

  return isShow ? (
    <Form
      labelCol={{ span: 6 }}
      layout="horizontal"
      initialValues={data}
      onFinish={onFinish}
      ref={formRef}
      style={{
        width: '80%',
      }}
    >
      <Form.Item label="话题标识" name="topic">
        <Input placeholder="12736899" />
      </Form.Item>
      <Form.Item label="话题标识类型" name="topicSignalType">
        <Radio.Group>
          <Radio.Button value={TopicSignalType.TopicV1}>旧话题id</Radio.Button>
          <Radio.Button value={TopicSignalType.TopicV2}>新话题id</Radio.Button>
          {/* <Radio.Button value={TopicSignalType.TopicName}>话题名称</Radio.Button> */}
        </Radio.Group>
      </Form.Item>
      <Form.Item label="时间范围">
        <Form.Item name="start" style={{ display: 'inline-block', width: 'calc(50% - 12px)' }}>
          <DatePicker dropdownClassName="drop-date" />
        </Form.Item>
        <span style={{ display: 'inline-block', width: '50px', lineHeight: '32px', textAlign: 'center' }}>
          ~ 今天
        </span>
      </Form.Item>
      <Form.Item label="保存目录">
        <Form.Item name="target">
          <Input />
        </Form.Item>
        <Button onClick={onSetFolder}>设置目录</Button>
        <Button onClick={onOpenFolder}>打开目录</Button>
      </Form.Item>
      <Form.Item label="分离封面与图片" name="isSplitDiffType" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button htmlType="submit">下载</Button>
      </Form.Item>
    </Form>
  ) : (
    <div />
  );
}
