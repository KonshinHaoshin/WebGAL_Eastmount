import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';

/**
 * 设置魔女图鉴按钮的显示状态
 * @param sentence
 */
export function manopedia(sentence: ISentence): IPerform {
  if (sentence.content === 'on') {
    webgalStore.dispatch(setStage({ key: 'enableManopedia', value: true }));
  } else {
    webgalStore.dispatch(setStage({ key: 'enableManopedia', value: false }));
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

