import { DragEvent, MouseEvent, useEffect, useRef } from 'react';
import { Game, GameObject, resource, RESOURCE_TYPE } from '@eva/eva.js';
import { RendererSystem } from '@eva/plugin-renderer';
import debounce from 'lodash.debounce';
import { loadModel } from 'renderer/common/model-loader';
import styles from './index.module.css';
import pickColor from './utils/color-picker';
import adaptor from './adaptor';
import getQuery from './utils/get-query';

export default function Main() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // cached status
  const windowIgnoreEvent = useRef<boolean | null>(null);
  const dragStatus = useRef<boolean>(false);

  // 初始化
  async function initGame(modelName: string) {
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
      ],
    });
    adaptor(game, modelName);
  }

  useEffect(() => {
    // 初始化模型
    const modelName = getQuery('modelName') ?? '';
    initGame(modelName);
  }, []);

  /**
   *
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

  const onCanvasDragOver = (e: DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  const onCanvasDrop = (e: DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // 拖放事件
    window.Events.emit('fileDrop', e);
  };

  const onDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    window.Events.emit('doubleClick', e);
  };

  const onContextClick = (e: MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  const onCanvasMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    // 右键拖拽
    if (e.button === 2) {
      dragStatus.current = true;
      window.common.moveWindow(true);
    }
  };

  const clearDragStatus = () => {
    if (dragStatus.current) {
      dragStatus.current = false;
      window.common.moveWindow(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        onContextMenu={onContextClick}
        onMouseDown={onCanvasMouseDown}
        onMouseLeave={clearDragStatus}
        onMouseUp={clearDragStatus}
        onDragOver={onCanvasDragOver}
        onDrop={onCanvasDrop}
        onDoubleClick={onDoubleClick}
        onMouseMove={onCanvasMouseMove}
        className={styles.canvas}
      />
    </div>
  );
}
