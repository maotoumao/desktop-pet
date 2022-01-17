import { Game } from '@eva/eva.js';
import { loadModel } from 'renderer/common/model-loader';
import beatsDetector from '../utils/beats-detector';
import live2d from './live2d';

const adaptMap = {
  live2d,
  spine: () => {},
  video: () => {},
};

export default async function (game: Game, modelName: string) {
  const modelInfo = await loadModel(modelName);
  if (modelInfo?.config?.beats) {
    beatsDetector();
  }
  adaptMap[modelInfo.config.type](game, modelInfo);
}
