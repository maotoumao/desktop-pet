/**
 * 获取canvas某点的颜色
 * performance: about 2ms
 */
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = 1;
offscreenCanvas.height = 1;
const ctx = offscreenCanvas.getContext('2d');

export default function pickColor(
  canvas: HTMLCanvasElement,
  x: number,
  y: number
) {
  ctx?.clearRect(0, 0, 1, 1);
  ctx?.drawImage(canvas, x, y, 1, 1, 0, 0, 1, 1);
  const imgData = ctx?.getImageData(0, 0, 1, 1)?.data;
  if (imgData?.length === 4) {
    return {
      r: imgData[0],
      g: imgData[1],
      b: imgData[2],
      a: imgData[3],
    };
  }
  return null;
}
