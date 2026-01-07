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

/**
 * 反驳演出脚本
 * @param sentence
 * @returns
 */
export const refute = (sentence: ISentence): IPerform => {
  const videoPath = assetSetter(sentence.content, fileType.figure);
  const goto = getStringArgByKey(sentence, 'goto');

  // 立即退出审判状态并停止计时，确保在视频播放瞬间 UI 消失
  const stageState = webgalStore.getState().stage;
  if (stageState.judgment !== '') {
    webgalStore.dispatch(setStage({ key: 'judgment', value: '' }));
    webgalStore.dispatch(setStage({ key: 'isJudgmentFastForward', value: false }));
    webgalStore.dispatch(setStage({ key: 'testimonyData', value: [] }));

    // 如果处于自动模式，立即解除
    if (WebGAL.gameplay.isAuto) {
      stopAuto();
    }
  }

  const perform = playVideo({
    ...sentence,
    content: videoPath,
    args: [...sentence.args, { key: 'noSkip', value: true }, { key: 'skipOff', value: true }],
  });

  if (perform.arrangePerformPromise) {
    perform.arrangePerformPromise = perform.arrangePerformPromise.then((p) => {
      const originalStop = p.stopFunction;
      // 如果设置了 goto，则禁用 playVideo 的默认下翻逻辑，由本脚本控制跳转
      if (goto) {
        p.goNextWhenOver = false;
      }
      p.stopFunction = () => {
        originalStop();

        // 跳转到 label 或者 scene
        if (goto) {
          const target = goto.toString().trim();
          const isScene = target.endsWith('.txt');

          if (isScene) {
            const sceneUrl = assetSetter(target, fileType.scene);
            // 确保引擎状态干净
            WebGAL.sceneManager.lockSceneWrite = false;
            setTimeout(() => {
              changeScene(sceneUrl, target);
            }, 0);
          } else {
            // 是标签
            // 确保引擎状态干净并执行跳转
            WebGAL.sceneManager.lockSceneWrite = false;
            setTimeout(() => {
              jmp(target);
            }, 0);
          }
        }
      };
      return p;
    });
  }

  return perform;
};
