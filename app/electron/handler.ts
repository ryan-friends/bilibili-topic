import { Config } from '@/common/interface';
import { ipcMain } from 'electron';
import { getConfig, saveConfig } from './services/config';
import download from './services/download';

export default class Handler {
  private bindingEvents = {};
  init() {
    this.bindEvent();
  }

  bindEvent() {
    this.bindingEvents = {
      download: this.download,
      getLastConfig: this.getLastConfig,
    };
    const self = this;
    ipcMain.handle('main-event', async (_event, ...args) => {
      const eventName = args[0];
      if (this.bindingEvents[eventName]) {
        const result = await this.bindingEvents[eventName].apply(self, args.splice(1));
        return result;
      }
    });
  }
  getLastConfig(): Config {
    return getConfig();
  }
  async download(configStr: string) {
    const config = JSON.parse(configStr);
    console.log(config);
    saveConfig(config);
    await download(config);
  }
}
