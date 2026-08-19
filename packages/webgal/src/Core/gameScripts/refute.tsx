import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';
import { playVideo } from './playVideo';
import { getStringArgByKey } from '../util/getSentenceArg';
import { stopAuto } from '../controller/gamePlay/autoPlay';
import { WebGAL } from '@/Core/WebGAL';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';
import { changeScene } from '../controller/scene/changeScene';
import { jmp } from '@/Core/gameScripts/label/jmp';

export const refute = (sentence: ISentence): IPerform => {
  const goto = getStringArgByKey(sentence, 'goto')?.trim();
  if (webgalStore.getState().stage.judgment !== '') {
    webgalStore.dispatch(setStage({ key: 'judgment', value: '' }));
    webgalStore.dispatch(setStage({ key: 'isJudgmentFastForward', value: false }));
    webgalStore.dispatch(setStage({ key: 'testimonyData', value: [] }));
    if (WebGAL.gameplay.isAuto) stopAuto();
  }
  const perform = playVideo({
    ...sentence,
    content: assetSetter(sentence.content, fileType.figure),
    args: [...sentence.args, { key: 'noSkip', value: true }, { key: 'skipOff', value: true }],
  });
  if (goto) {
    perform.goNextWhenOver = false;
    const originalStop = perform.stopFunction;
    perform.stopFunction = () => {
      originalStop();
      WebGAL.sceneManager.lockSceneWrite = false;
      setTimeout(() => {
        if (goto.endsWith('.txt')) changeScene(assetSetter(goto, fileType.scene), goto);
        else jmp(goto);
      }, 0);
    };
  }
  return perform;
};
