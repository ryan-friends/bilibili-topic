import { ipcMain } from 'electron';
import { getConfig, saveConfig } from './lib/config';
import download from './lib/download';

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
  getLastConfig(): { [key: string]: any } {
    return getConfig();
  }
  async download(topic: string, start: string, target: string) {
    saveConfig({ start, topic, target });
    await download(start, topic, target);
  }
}
