export {};

declare global {
  interface Window {
    common: {
      /** 获取Assets中的资源 */
      getAssets: (...paths: string[]) => string;
      /** 设置主窗口事件处理状态 */
      setIgnoreMouseEvents: (ignore: boolean) => boolean;
    };
  }
}
