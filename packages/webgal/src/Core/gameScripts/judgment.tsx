import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';
import { playVideo } from './playVideo';
import { getStringArgByKey } from '../util/getSentenceArg';
import { switchAuto, stopAuto } from '../controller/gamePlay/autoPlay';
import { WebGAL } from '@/Core/WebGAL';
// @ts-ignore
import judgmentBegins from '@/assets/dragonspring/judgment/judgmentBegins.webm';
// @ts-ignore
import judgmentConcluded from '@/assets/dragonspring/judgment/judgmentConcluded.webm';

/**
 * 解析 MM:SS:mmm 格式的时间为毫秒
 * @param timeStr
 * @returns
 */
const parseTimerToMs = (timeStr: string | null): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length !== 3) return 0;
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  const ms = parseInt(parts[2], 10);
  return minutes * 60 * 1000 + seconds * 1000 + ms;
};

/**
 * 审判演出脚本
 * @param sentence
 * @returns
 */
export const judgment = (sentence: ISentence): IPerform => {
  const content = sentence.content;
  if (content === 'begins') {
    const timerStr = getStringArgByKey(sentence, 'timer');
    const timeout = getStringArgByKey(sentence, 'timeout');
    const timerMs = parseTimerToMs(timerStr);

    webgalStore.dispatch(setStage({ key: 'judgment', value: 'video_playing' }));
    if (timerMs > 0) {
      webgalStore.dispatch(setStage({ key: 'judgmentTimer', value: timerMs }));
    }
    if (timeout) {
      webgalStore.dispatch(setStage({ key: 'judgmentTimeout', value: timeout }));
    }
    // 开启审判时重置加速状态
    webgalStore.dispatch(setStage({ key: 'isJudgmentFastForward', value: false }));

    // 自动开启自动播放
    if (!WebGAL.gameplay.isAuto) {
      switchAuto();
    }

    const perform = playVideo({
      ...sentence,
      content: judgmentBegins,
      args: [...sentence.args, { key: 'noSkip', value: true }, { key: 'skipOff', value: true }],
    });

    if (perform.arrangePerformPromise) {
      perform.arrangePerformPromise = perform.arrangePerformPromise.then((p) => {
        const originalStop = p.stopFunction;
        p.stopFunction = () => {
          originalStop();
          webgalStore.dispatch(setStage({ key: 'judgment', value: 'begins' }));
        };
        return p;
      });
    }

    return perform;
  }
  if (content === 'exit') {
    webgalStore.dispatch(setStage({ key: 'judgment', value: '' }));
    webgalStore.dispatch(setStage({ key: 'testimonyData', value: [] }));
    // 退出时自动解除 auto 模式
    if (WebGAL.gameplay.isAuto) {
      stopAuto();
    }
    return {
      performName: 'none',
      duration: 0,
      isHoldOn: false,
      stopFunction: () => {},
      blockingNext: () => false,
      blockingAuto: () => true,
      stopTimeout: undefined,
    };
  }
  if (content === 'concluded') {
    webgalStore.dispatch(setStage({ key: 'judgment', value: 'concluded' }));
    const perform = playVideo({
      ...sentence,
      content: judgmentConcluded,
      args: [...sentence.args, { key: 'noSkip', value: true }, { key: 'skipOff', value: true }],
    });
    if (perform.arrangePerformPromise) {
      perform.arrangePerformPromise = perform.arrangePerformPromise.then((p) => {
        const originalStop = p.stopFunction;
        p.stopFunction = () => {
          originalStop();
          webgalStore.dispatch(setStage({ key: 'judgment', value: '' }));
          // 退出时自动解除 auto 模式
          if (WebGAL.gameplay.isAuto) {
            stopAuto();
          }
        };
        return p;
      });
    }
    return perform;
  }
  return {
    performName: 'none',
    duration: 0,
    isHoldOn: false,
    stopFunction: () => {},
    blockingNext: () => false,
    blockingAuto: () => true,
    stopTimeout: undefined,
  };
};
