// import { Button, Form, Input, DatePicker } from 'antd';
import * as React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';

import { AppLayout, AppRouter } from '@/src/components';
import routes from './auto-routes';

interface AppProps {
  createConfig: CreateConfig;
}

export default class App extends React.Component<AppProps> {
  render(): JSX.Element {
    return (
      <ConfigProvider locale={zhCN}>
        <AppLayout createConfig={this.props.createConfig}>
          <AppRouter routes={routes} store={$store} />
        </AppLayout>
      </ConfigProvider>
    );
  }
}
