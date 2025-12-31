import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { clearAllItems } from '@/store/stageReducer';
import { logger } from '@/Core/util/logger';

/**
 * 清除所有物品
 * 用法: clearItem:
 */
export const clearItem = (sentence: ISentence): IPerform => {
  // 清除所有物品
  webgalStore.dispatch(clearAllItems());
  
  logger.debug('清除所有物品');

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
