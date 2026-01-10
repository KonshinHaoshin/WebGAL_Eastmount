import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';
import { WebGAL } from '@/Core/WebGAL';
import { stopAuto, switchAuto } from '../controller/gamePlay/autoPlay';

/**
 * 语句执行的模板代码
 * @param sentence
 */
export function setTextbox(sentence: ISentence): IPerform {
  const stageState = webgalStore.getState().stage;
  if (sentence.content === 'hide' || sentence.content === 'off') {
    webgalStore.dispatch(setStage({ key: 'isDisableTextbox', value: true }));
    // 在审判模式下，隐藏文本框时强制开启自动播放
    if (stageState.judgment !== '' && !WebGAL.gameplay.isAuto) {
      switchAuto();
    }
  } else {
    webgalStore.dispatch(setStage({ key: 'isDisableTextbox', value: false }));
    // 在审判模式下，显示文本框时强制关闭自动播放，以便玩家手动点击
    if (stageState.judgment !== '' && WebGAL.gameplay.isAuto) {
      stopAuto();
    }
  }
  return {
    performName: 'none',
    duration: 0,
    isHoldOn: false,
    stopFunction: () => {},
    blockingNext: () => false,
    blockingAuto: () => true,
    stopTimeout: undefined, // 暂时不用，后面会交给自动清除
  };
}
