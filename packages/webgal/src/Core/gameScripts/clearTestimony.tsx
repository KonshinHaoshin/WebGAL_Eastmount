import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';

/**
 * 清空证言指令
 */
export const clearTestimony = (sentence: ISentence): IPerform => {
  webgalStore.dispatch(setStage({ key: 'testimonyData', value: [] }));

  return {
    performName: 'clearTestimony',
    duration: 0,
    isHoldOn: false,
    stopFunction: () => {},
    blockingNext: () => false,
    blockingAuto: () => false,
    stopTimeout: undefined,
  };
};

