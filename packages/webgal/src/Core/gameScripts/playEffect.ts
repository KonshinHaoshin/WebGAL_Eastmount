import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { logger } from '@/Core/util/logger';
import { RootState, webgalStore } from '@/store/store';
import { getNumberArgByKey, getStringArgByKey } from '@/Core/util/getSentenceArg';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { useSelector } from 'react-redux';
import { WebGAL } from '@/Core/WebGAL';
import { WEBGAL_NONE } from '@/Core/constants';

/**
 * 播放一段效果音
 * @param sentence 语句
 */
export const playEffect = (sentence: ISentence): IPerform => {
  logger.debug('play SE');
  // 如果有ID，这里被覆盖，一般用于循环的情况
  // 有循环参数且有ID，就循环
  let performInitName = 'effect-sound';
  // 清除先前的效果音
  WebGAL.gameplay.performController.unmountPerform(performInitName, true);
  let url = sentence.content;
  let isLoop = false;
  // 清除带id的效果音
  const id = getStringArgByKey(sentence, 'id') ?? '';
  if (id) {
    performInitName = `effect-sound-${id}`;
    WebGAL.gameplay.performController.unmountPerform(performInitName, true);
    isLoop = true;
  }
  let isOver = false;
  if (!url || url === WEBGAL_NONE) {
    return {
      performName: WEBGAL_NONE,
      duration: 0,
      isHoldOn: false,
      blockingAuto(): boolean {
        return false;
      },
      blockingNext(): boolean {
        return false;
      },
      stopFunction(): void {},
      stopTimeout: undefined,
    };
  }
  return {
    performName: 'none',
    blockingAuto(): boolean {
      return false;
    },
    blockingNext(): boolean {
      return false;
    },
    isHoldOn: false,
    stopFunction(): void {},
    stopTimeout: undefined,

    duration: 1000 * 60 * 60,
    arrangePerformPromise: new Promise((resolve) => {
      // 播放效果音
      setTimeout(() => {
        let volume = getNumberArgByKey(sentence, 'volume') ?? 100; // 获取音量%
        volume = Math.max(0, Math.min(volume, 100));
        let seElement = document.createElement('audio');
        seElement.src = url;
        if (isLoop) {
          seElement.loop = true;
        }
        const userDataState = webgalStore.getState().userData;
        const mainVol = userDataState.optionData.volumeMain;
        const seVol = mainVol * 0.01 * (userDataState.optionData?.seVolume ?? 100) * 0.01 * volume * 0.01;
        seElement.volume = seVol;
        seElement.currentTime = 0;
        const perform: IPerform = {
          performName: performInitName,
          duration: 1000 * 60 * 60,
          isHoldOn: isLoop,
          skipNextCollect: true,
          stopFunction: () => {
            seElement.pause();
            seElement.remove();
          },
          blockingNext: () => false,
          blockingAuto: () => {
            if (isLoop) return false;
            return !isOver;
          },
          stopTimeout: undefined, // 暂时不用，后面会交给自动清理
        };
        resolve(perform);
        seElement?.play();
        const endFunc = () => {
          for (const e of WebGAL.gameplay.performController.performList) {
            if (e.performName === performInitName) {
              isOver = true;
              e.stopFunction();
              WebGAL.gameplay.performController.unmountPerform(e.performName);
            }
          }
        };
        seElement.onended = endFunc;
        seElement.addEventListener('error', () => {
          logger.error(`播放效果音失败 ${url}`);
          endFunc();
        });
      }, 1);
    }),
  };
};
