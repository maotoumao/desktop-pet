import { Game, GameObject, resource, RESOURCE_TYPE } from '@eva/eva.js';
import { Easing, Tween } from '@tweenjs/tween.js';
import { Live2DSystem, Live2D } from 'eva-plugin-renderer-live2d';

function resetParamsToDefault(game: Game, live2dComponent: any) {
  const tween = new Tween(
    live2dComponent.model.internalModel.coreModel._model.parameters.values
  )
    .to(
      live2dComponent.model.internalModel.coreModel._model.parameters
        .defaultValues,
      1000
    )
    .easing(Easing.Cubic.InOut)
    .start();

  function updateTween() {
    if (!tween.update()) {
      game.ticker.remove(updateTween);
    }
  }
  game.ticker.add(updateTween);
}

const l2dMusicHandler = (() => {
  const paramTicker: {
    [k: string]: {
      updateFn: (args: { deltaTime: number }) => void;
    };
  } = {};
  let direction = 1;
  let bpm = 0;

  return {
    setBpm(_bpm: number) {
      bpm = _bpm;
    },

    addParamTicker(
      game: Game,
      live2dComponent: any,
      paramId: string,
      reverse = false,
      speed = 1
    ) {
      const index =
        live2dComponent.model.internalModel.coreModel.getParameterIndex(
          paramId
        );
      const maxVal =
        live2dComponent.model.internalModel.coreModel.getParameterMaximumValue(
          index
        );
      const minVal =
        live2dComponent.model.internalModel.coreModel.getParameterMinimumValue(
          index
        );

      paramTicker[paramId] = {
        updateFn({ deltaTime }: any) {
          if (live2dComponent.model.internalModel.motionManager.playing) {
            return;
          }
          if (bpm === 0) {
            resetParamsToDefault(game, live2dComponent);
            return;
          }
          const deltaVal =
            ((((speed * deltaTime) / 1000) * bpm) / 60) * (maxVal - minVal);
          let newVal =
            live2dComponent.model.internalModel.coreModel._model.parameters
              .values[index] +
            (reverse ? -1 : 1) * direction * deltaVal;
          if (newVal > maxVal) {
            direction = -1;
            newVal = maxVal - (newVal - maxVal);
          }
          if (newVal < minVal) {
            direction = 1;
            newVal = minVal * 2 - newVal;
          }
          live2dComponent.model.internalModel.coreModel._model.parameters.values[
            index
          ] = newVal;
        },
      };

      game.ticker.add(paramTicker[paramId].updateFn);
    },

    removeParamTicker(game: Game, param: string) {
      game.ticker.remove(param);
      delete paramTicker[param];
    },
  };
})();

let idleTimer: number | null = null;
function playIdle(live2d: any, config: any) {
  const interval = config.interval ?? [60, 180];
  interval[1] = interval[1] ?? interval[0];
  const randomTime =
    (interval[0] + (interval[1] - interval[0]) * Math.random()) * 1000;
  if (idleTimer) {
    const motions = config?.motions ?? [];
    const randomIndex = Math.floor(Math.random() * motions.length);
    live2d.model.motion(
      motions[randomIndex].group,
      motions[randomIndex].index,
      2
    );
  }
  idleTimer = window.setTimeout(
    playIdle.bind(null, live2d, config),
    randomTime
  );
}

export default async function renderLive2dModel(
  game: Game,
  modelInfo: Common.IModelInfo
) {
  if (!game.getSystem(Live2DSystem)) {
    game.addSystem(new Live2DSystem());
  }

  const config = modelInfo.config;

  // 模型资源
  resource.addResource([
    {
      name: modelInfo.modelPath,
      // @ts-ignore
      type: RESOURCE_TYPE.LIVE2D,
      src: {
        url: {
          type: 'data',
          data: modelInfo.modelPath,
        },
      },
    },
  ]);

  // 游戏对象
  const go = new GameObject('go', {
    size: {
      width: 0,
      height: 0,
    },
    position: {
      x: 0,
      y: 0,
    },
    scale: {
      x: config?.transform?.scale?.x ?? 1,
      y: config?.transform?.scale?.y ?? 1,
    },
  });

  // live2d
  const live2d = go.addComponent(
    new Live2D({
      resource: modelInfo.modelPath,
    })
  );

  // @ts-ignore
  window.ll = live2d;

  // 加载后
  live2d.on('loaded', () => {
    go.transform.position.x =
      (window.innerWidth - live2d.model.getBounds().width) / 2;
    go.transform.position.y =
      window.innerHeight - live2d.model.getBounds().height;
    // 初始动作
    if (config?.motions?.start) {
      live2d.model.motion(
        config?.motions?.start.group,
        config?.motions?.start.index,
        3
      );
    }

    // 点击事件
    live2d.model.on('hit', (hitAreas: string[]) => {
      for (let idx = 0; idx < hitAreas.length; ++idx) {
        const _hitMotion = config?.motions?.hitArea[hitAreas[idx]];
        if (_hitMotion) {
          live2d.model.motion(_hitMotion.group, _hitMotion.index, 3);
          break;
        }
      }
    });

    // 表情播放完成
    live2d.model.internalModel.motionManager.on(
      'motionFinish',
      (group: any, index: number, audio?: any) => {
        resetParamsToDefault(game, live2d);
      }
    );

    // 空闲行为
    if (config?.motions?.idle) {
      playIdle(live2d, config.motions.idle);
    }

    // 初始化音乐响应
    if (config.beats) {
      const params = config.beats.params ?? {};
      const keys = Object.keys(params);
      for (const key of keys) {
        l2dMusicHandler.addParamTicker(
          game,
          live2d,
          key,
          params[key]?.reverse,
          params[key]?.speed
        );
      }
    }

    // 响应事件
    window.Events.on('fileDrop', (e) => {
      const files = e.dataTransfer.files ?? [];
      const file: File = files[0];
      const fileDropAction = config?.actions?.fileDrop ?? {};
      if (fileDropAction.motion) {
        live2d.model.internalModel.motionManager.stopAllMotions();
        live2d.model.motion(
          fileDropAction.motion.group,
          fileDropAction.motion.index,
          3
        );
      }
      if (fileDropAction.script) {
        window.common.executeScript(
          fileDropAction.script.replace(/\$0/g, file.path)
        );
      }
    });

    window.Events.on('doubleClick', (e) => {
      const doubleClickAction = config?.actions?.doubleClick ?? {};
      if (doubleClickAction.motion) {
        live2d.model.internalModel.motionManager.stopAllMotions();
        live2d.model.motion(
          doubleClickAction.motion.group,
          doubleClickAction.motion.index,
          3
        );
      }
      if (doubleClickAction.script) {
        window.common.executeScript(doubleClickAction.script);
      }
    });

    window.Events.on('musicBpm', (bpm) => {
      l2dMusicHandler.setBpm(bpm);
    });
  });
  game.scene.addChild(go);
}
