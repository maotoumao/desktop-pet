import { Game } from '@eva/eva.js';
import { loadModel } from 'renderer/common/model-loader';
import live2d from './live2d';

const adaptMap = {
  live2d,
  spine: () => {},
  video: () => {},
};

export default async function (game: Game, modelName: string) {
  const modelInfo = await loadModel(modelName);
  adaptMap[modelInfo.config.type](game, modelInfo);
}
