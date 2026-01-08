import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';
import { getObjectArgByKey, getBooleanArgByKey, getStringArgByKey, getNumberArgByKey } from '../util/getSentenceArg';
import { playVocal } from './vocal';
import { useTextAnimationDuration, useTextDelay } from '@/hooks/useTextOptions';
import { compileSentence } from '@/Stage/TextBox/TextBox';
import { getRandomPerformName } from '@/Core/Modules/perform/performController';

/**
 * 证言指令实现
 * testimony:文本内容 -refutes={"关键词":"跳转目标"} -colors={"关键词":"颜色代码"} -left -right -vocal=...;
 */
export const testimony = (sentence: ISentence): IPerform => {
  const content = sentence.content;
  const refutes = (getObjectArgByKey(sentence, 'refutes') as Record<string, string>) || {};
  const colors = (getObjectArgByKey(sentence, 'colors') as Record<string, string>) || {};
  const vocal = getStringArgByKey(sentence, 'vocal');
  const y = getNumberArgByKey(sentence, 'y') || undefined;

  let pos: 'left' | 'right' | 'center' = 'center';
  if (getBooleanArgByKey(sentence, 'left')) pos = 'left';
  if (getBooleanArgByKey(sentence, 'right')) pos = 'right';

  const currentTestimonies = webgalStore.getState().stage.testimonyData;

  // 将新证言添加到列表末尾
  webgalStore.dispatch(
    setStage({
      key: 'testimonyData',
      value: [
        ...currentTestimonies,
        {
          content,
          refutes,
          colors,
          pos,
          y,
        },
      ],
    }),
  );

  // 播放语音
  if (vocal) {
    playVocal(sentence);
  }

  // 计算播放时间，参考 say.ts
  const userDataState = webgalStore.getState().userData;
  const textDelay = useTextDelay(userDataState.optionData.textSpeed);
  const textNodes = compileSentence(sentence.content, 3);
  const len = textNodes.reduce((prev, curr) => prev + curr.length, 0);
  const sentenceDelay = textDelay * len;
  const endDelay = useTextAnimationDuration(userDataState.optionData.textSpeed) / 2;

  const performInitName: string = getRandomPerformName();

  return {
    performName: performInitName,
    duration: sentenceDelay + endDelay,
    isHoldOn: false,
    stopFunction: () => {
      // 停止逻辑
    },
    blockingNext: () => false,
    blockingAuto: () => true, // 审问时需要自动播放阻塞
    stopTimeout: undefined,
  };
};
