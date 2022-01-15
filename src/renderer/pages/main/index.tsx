import { MouseEvent, useEffect, useRef } from 'react';
import { Game, GameObject, resource, RESOURCE_TYPE } from '@eva/eva.js';
import { RendererSystem } from '@eva/plugin-renderer';
import { Live2DSystem, Live2D } from 'eva-plugin-renderer-live2d';
import debounce from 'lodash.debounce';
import styles from './index.module.css';
import pickColor from './utils/color-picker';

export default function Main() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // cached status
  const windowIgnoreEvent = useRef<boolean | null>(null);

  // 初始化
  function initGame() {
    if (!canvasRef.current) {
      return;
    }
    const [_width, _height] = [window.innerWidth, window.innerHeight];

    canvasRef.current.style.width = `${_width}px`;
    canvasRef.current.style.height = `${_height}px`;
    const game = new Game({
      systems: [
        new RendererSystem({
          canvas: canvasRef.current,
          width: _width,
          height: _height,
          transparent: true,
          preserveDrawingBuffer: true,
        }),
        new Live2DSystem(),
      ],
    });
    console.log(window.common.getAssets('models/海坊主/海坊主.model3.json'));
    resource.addResource([
      {
        name: '海坊主',
        // @ts-ignore
        type: RESOURCE_TYPE.LIVE2D,
        src: {
          url: {
            type: 'data',
            data: window.common.getAssets('models/海坊主/海坊主.model3.json'),
          },
        },
      },
    ]);

    const go = new GameObject('aaa', {
      size: {
        width: 0,
        height: 0,
      },
      position: {
        x: 0,
        y: 0,
      },
      origin: {
        x: 0.5,
        y: 0.5,
      },
      scale: {
        x: 0.7,
        y: 0.7,
      },
    });
    const live2d = go.addComponent(
      new Live2D({
        resource: '海坊主',
      })
    );
    game.scene.addChild(go);
  }

  useEffect(() => {
    // 初始化live2d
    initGame();
  }, []);

  /**
   * TODO: move防抖；窗口状态缓存（不要有这么频繁的调用，这个值可以缓存的; 以及可以增加debounce）
   * @param e
   */
  const onCanvasMouseMove = debounce((e: MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = [e.clientX, e.clientY];
    if (!canvasRef.current) {
      return;
    }
    const color = pickColor(canvasRef.current, x, y);
    if (!color || color.r + color.g + color.b + color.a === 0) {
      // 透明区域，忽略窗口事件
      if (windowIgnoreEvent.current !== true) {
        window.common.setIgnoreMouseEvents(true);
        windowIgnoreEvent.current = true;
      }
    } else if (windowIgnoreEvent.current !== false) {
      window.common.setIgnoreMouseEvents(false);
      windowIgnoreEvent.current = false;
    }
  }, 32);

  return (
    <div className={styles.wrapper} onContextMenu={() => false}>
      <canvas
        ref={canvasRef}
        // onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
        className={styles.canvas}
      />
    </div>
  );
}
