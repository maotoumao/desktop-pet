import EventEmitter from 'eventemitter3';

export {};

declare global {
  interface Window {
    common: {
      /** 获取Assets中的资源 */
      getAssets: (...paths: string[]) => string;
      /** 设置主窗口事件处理状态 */
      setIgnoreMouseEvents: (ignore: boolean) => boolean;
      /** 执行脚本 */
      executeScript: (script: string) => void;
      /** 移动主窗口 */
      moveWindow: (canMove: boolean) => void;
      /** 加载模型 */
      loadModel: (modelName: string) => void;
      // 获取模型列表
      getModelList: () => string[];
      /** 窗口提示 */
      notification: (data: { title?: string; message?: string }) => void;
    };
    fs: any;
    /** 全局事件 */
    Events: EventEmitter;
  }
}
