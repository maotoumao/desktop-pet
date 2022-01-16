declare namespace Common {
  interface IModelConfig {
    type: 'live2d' | 'spine' | 'video';
    entry: string;
    [k: string]: any;
  }
  export interface IModelInfo {
    config: IModelConfig;
    modelPath: string;
  }

  export interface Live2DConfig extends IModelConfig {
    type: 'live2d';
  }
}
