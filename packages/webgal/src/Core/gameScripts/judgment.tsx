import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';
import { playVideo } from './playVideo';
// @ts-ignore
import judgmentBegins from '@/assets/dragonspring/judgment/judgmentBegins.webm';
// @ts-ignore
import judgmentConcluded from '@/assets/dragonspring/judgment/judgmentConcluded.webm';

/**
 * 审判演出脚本
 * @param sentence
 * @returns
 */
export const judgment = (sentence: ISentence): IPerform => {
  const content = sentence.content;
  if (content === 'begins') {
    webgalStore.dispatch(setStage({ key: 'judgment', value: 'begins' }));
    return playVideo({
      ...sentence,
      content: judgmentBegins,
      args: [...sentence.args, { key: 'noSkip', value: true }, { key: 'skipOff', value: true }],
    });
  }
  if (content === 'concluded') {
    webgalStore.dispatch(setStage({ key: 'judgment', value: '' }));
    return playVideo({
      ...sentence,
      content: judgmentConcluded,
      args: [...sentence.args, { key: 'noSkip', value: true }, { key: 'skipOff', value: true }],
    });
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
