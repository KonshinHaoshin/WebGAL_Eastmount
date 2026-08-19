import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform, createNonePerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';
import { playVideo } from './playVideo';
import { getStringArgByKey } from '../util/getSentenceArg';
import { switchAuto, stopAuto } from '../controller/gamePlay/autoPlay';
import { WebGAL } from '@/Core/WebGAL';
import judgmentBegins from '@/assets/dragonspring/judgment/judgmentBegins.webm';
import judgmentConcluded from '@/assets/dragonspring/judgment/judgmentConcluded.webm';

const parseTimerToMs = (value: string | null): number => {
  const parts = value?.split(':') ?? [];
  if (parts.length !== 3) return 0;
  return Number.parseInt(parts[0], 10) * 60_000 + Number.parseInt(parts[1], 10) * 1_000 + Number.parseInt(parts[2], 10);
};

const withStop = (perform: IPerform, callback: () => void): IPerform => {
  const originalStop = perform.stopFunction;
  perform.stopFunction = () => { originalStop(); callback(); };
  return perform;
};

export const judgment = (sentence: ISentence): IPerform => {
  if (sentence.content === 'begins') {
    const timerMs = parseTimerToMs(getStringArgByKey(sentence, 'timer'));
    const timeout = getStringArgByKey(sentence, 'timeout');
    webgalStore.dispatch(setStage({ key: 'judgment', value: 'video_playing' }));
    if (timerMs > 0) webgalStore.dispatch(setStage({ key: 'judgmentTimer', value: timerMs }));
    if (timeout) webgalStore.dispatch(setStage({ key: 'judgmentTimeout', value: timeout }));
    webgalStore.dispatch(setStage({ key: 'isJudgmentFastForward', value: false }));
    if (!WebGAL.gameplay.isAuto) switchAuto();
    return withStop(playVideo({
      ...sentence,
      content: judgmentBegins,
      args: [...sentence.args, { key: 'noSkip', value: true }, { key: 'skipOff', value: true }],
    }), () => webgalStore.dispatch(setStage({ key: 'judgment', value: 'begins' })));
  }
  if (sentence.content === 'exit') {
    webgalStore.dispatch(setStage({ key: 'judgment', value: '' }));
    webgalStore.dispatch(setStage({ key: 'testimonyData', value: [] }));
    if (WebGAL.gameplay.isAuto) stopAuto();
    return createNonePerform();
  }
  if (sentence.content === 'concluded') {
    webgalStore.dispatch(setStage({ key: 'judgment', value: 'concluded' }));
    return withStop(playVideo({
      ...sentence,
      content: judgmentConcluded,
      args: [...sentence.args, { key: 'noSkip', value: true }, { key: 'skipOff', value: true }],
    }), () => {
      webgalStore.dispatch(setStage({ key: 'judgment', value: '' }));
      if (WebGAL.gameplay.isAuto) stopAuto();
    });
  }
  return createNonePerform();
};
