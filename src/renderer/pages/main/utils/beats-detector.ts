// @ts-nocheck
let counter = 0;
const beats = [];
function emitBpmEvent(value) {
  if (beats.length >= 5) {
    beats.shift();
  }
  beats.push(value);
  if (!counter) {
    window.Events.emit(
      'musicBpm',
      beats.length
        ? beats.reduce((prev, curr) => prev + curr) / beats.length
        : 0
    );
  }

  counter = (counter + 1) % 2;
}

async function record() {
  const audioSource: MediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'desktop',
      },
    },
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
      },
    },
  });

  (audioSource.getVideoTracks() ?? []).forEach((track) => {
    audioSource.removeTrack(track);
  });

  const sampleRate = 5120;

  const context = new AudioContext({
    sampleRate,
  });

  const processor = context.createScriptProcessor(16384, 2, 2);

  processor.onaudioprocess = (e) => {
    const bufferData = e.inputBuffer.getChannelData(0);
    const duration = e.inputBuffer.duration;

    // 实测 这个采样率足够了。那么接下来就瞎搞吧
    // 采样率4096, 这段时间刚好4s，真的会有30bpm的歌吗
    // 寻找peaks，先拿一个轨道看吧
    // 先来个放大
    const max = Math.max(...bufferData);
    if (max < 0.3) {
      // 听不见
      emitBpmEvent(0);
      return;
    }
    bufferData.forEach((k, index) => {
      bufferData[index] = k / max;
    });
    const peaks = [];
    bufferData.forEach((buf, index) => {
      if (buf > 0.7) {
        peaks.push(index);
      }
    });
    let rhythms = [];
    peaks.forEach((k, i) => i && rhythms.push(k - peaks[i - 1]));
    rhythms = rhythms.filter((k) => k > sampleRate / 8);
    if (!rhythms.length) {
      emitBpmEvent(0);
      return;
    }
    if (rhythms.length > 4) {
      const avg =
        (rhythms.reduce((prev, curr) => prev + curr) -
          Math.max(...rhythms) -
          Math.min(...rhythms)) /
        (rhythms.length - 2);
      const beat = (60 / avg) * sampleRate;
      emitBpmEvent(beat > 200 ? beat / 2 : beat, rhythms.length);
    } else {
      const avg = rhythms.reduce((prev, curr) => prev + curr) / rhythms.length;
      const beat = (60 / avg) * sampleRate;
      emitBpmEvent(beat > 200 ? beat / 2 : beat, rhythms.length);
    }
  };
  // 搞个低通滤波器
  const mediaNode = context.createMediaStreamSource(audioSource);
  const filterNode = context.createBiquadFilter();
  filterNode.type = 'lowpass';
  mediaNode.connect(filterNode);
  filterNode.connect(processor);
  processor.connect(context.destination);
}

export default record;
