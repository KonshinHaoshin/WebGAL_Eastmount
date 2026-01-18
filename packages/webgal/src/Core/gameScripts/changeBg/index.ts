import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
// import {getRandomPerformName} from '../../../util/getRandomPerformName';
import styles from '@/Stage/stage.module.scss';
import { webgalStore } from '@/store/store';
import { setStage, stageActions } from '@/store/stageReducer';
import { getNumberArgByKey, getStringArgByKey } from '@/Core/util/getSentenceArg';
import { unlockCgInUserData } from '@/store/userDataReducer';
import { logger } from '@/Core/util/logger';
import { ITransform } from '@/store/stageInterface';
import { generateTransformAnimationObj } from '@/Core/controller/stage/pixi/animations/generateTransformAnimationObj';
import { AnimationFrame, IUserAnimation } from '@/Core/Modules/animations';
import cloneDeep from 'lodash/cloneDeep';
import { getAnimateDuration } from '@/Core/Modules/animationFunctions';
import { WebGAL } from '@/Core/WebGAL';
import { DEFAULT_BG_OUT_DURATION } from '@/Core/constants';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';

/**
 * 进行背景图片的切换
 * @param sentence 语句
 * @return {IPerform}
 */
export const changeBg = (sentence: ISentence): IPerform => {
  const url = sentence.content;
  const unlockName = getStringArgByKey(sentence, 'unlockname') ?? '';
  const series = getStringArgByKey(sentence, 'series') ?? 'default';
  const transformString = getStringArgByKey(sentence, 'transform');
  const durationArg = getNumberArgByKey(sentence, 'duration');
  const enterDurationArg = getNumberArgByKey(sentence, 'enterDuration');
  const exitDurationArg = getNumberArgByKey(sentence, 'exitDuration');
  let duration = durationArg ?? DEFAULT_BG_OUT_DURATION;
  const enterDuration = enterDurationArg ?? duration;
  const exitDuration = exitDurationArg ?? DEFAULT_BG_OUT_DURATION;
  const ease = getStringArgByKey(sentence, 'ease') ?? '';
  const type = getStringArgByKey(sentence, 'type') ?? 'default';

  // 解析 LUT 参数
  const lutArg = getStringArgByKey(sentence, 'lut');
  if (lutArg !== null) {
    const lutPath = lutArg ? assetSetter(lutArg, fileType.lut) : '';
    webgalStore.dispatch(setStage({ key: 'bgLut', value: lutPath }));
  }

  const dispatch = webgalStore.dispatch;
  if (unlockName !== '') {
    dispatch(unlockCgInUserData({ name: unlockName, url, series }));
  }

  /**
   * 判断背景 URL 是否发生了变化
   */
  const isUrlChanged = webgalStore.getState().stage.bgName !== sentence.content;

  /**
   * 删除相关 Effects，因为已经移除了
   */
  if (isUrlChanged) {
    dispatch(stageActions.removeEffectByTargetId(`bg-main`));
    dispatch(stageActions.removeAnimationSettingsByTarget(`bg-main`));
  }

  if (type === 'blinds') {
    // 百叶窗效果：先淡出到黑，再百叶窗进场
    const blindDuration = enterDurationArg ?? durationArg ?? 1333;
    WebGAL.animationManager.nextExitAnimationName.set('bg-main-off', 'universalSoftOff');
    WebGAL.animationManager.nextExitAnimationDuration.set('bg-main-off', 1000);
    WebGAL.animationManager.nextEnterAnimationName.set('bg-main', 'blindsIn');
    WebGAL.animationManager.nextEnterAnimationDuration.set('bg-main', 1000);
    duration = blindDuration;
  } else {
    // 处理 transform 或默认 transform
    let animationObj: AnimationFrame[];
    if (transformString) {
      try {
        const frame = JSON.parse(transformString.toString()) as AnimationFrame;
        animationObj = generateTransformAnimationObj('bg-main', frame, enterDuration, ease);
        animationObj[0].alpha = 0;
        const animationName = (Math.random() * 10).toString(16);
        const newAnimation: IUserAnimation = { name: animationName, effects: animationObj };
        WebGAL.animationManager.addAnimation(newAnimation);
        duration = getAnimateDuration(animationName);
        WebGAL.animationManager.nextEnterAnimationName.set('bg-main', animationName);
        WebGAL.animationManager.nextEnterAnimationDuration.set('bg-main', duration);
        webgalStore.dispatch(
          stageActions.updateAnimationSettings({ target: 'bg-main', key: 'enterAnimationName', value: animationName }),
        );
      } catch (e) {
        applyDefaultTransform();
      }
    } else {
      applyDefaultTransform();
    }

    function applyDefaultTransform() {
      const frame = {};
      animationObj = generateTransformAnimationObj('bg-main', frame as AnimationFrame, enterDuration, ease);
      animationObj[0].alpha = 0;
      const animationName = (Math.random() * 10).toString(16);
      const newAnimation: IUserAnimation = { name: animationName, effects: animationObj };
      WebGAL.animationManager.addAnimation(newAnimation);
      duration = getAnimateDuration(animationName);
      WebGAL.animationManager.nextEnterAnimationName.set('bg-main', animationName);
      WebGAL.animationManager.nextEnterAnimationDuration.set('bg-main', duration);
      webgalStore.dispatch(
        stageActions.updateAnimationSettings({ target: 'bg-main', key: 'enterAnimationName', value: animationName }),
      );
    }

    const enterAnimation = getStringArgByKey(sentence, 'enter');
    const exitAnimation = getStringArgByKey(sentence, 'exit');
    if (enterAnimation) {
      WebGAL.animationManager.nextEnterAnimationName.set('bg-main', enterAnimation);
      duration = getAnimateDuration(enterAnimation);
      webgalStore.dispatch(
        stageActions.updateAnimationSettings({ target: 'bg-main', key: 'enterAnimationName', value: enterAnimation }),
      );
    }
    if (exitAnimation) {
      WebGAL.animationManager.nextExitAnimationName.set('bg-main-off', exitAnimation);
      duration = getAnimateDuration(exitAnimation);
      webgalStore.dispatch(
        stageActions.updateAnimationSettings({ target: 'bg-main', key: 'exitAnimationName', value: exitAnimation }),
      );
    }
    if (enterDuration >= 0) {
      webgalStore.dispatch(
        stageActions.updateAnimationSettings({ target: 'bg-main', key: 'enterDuration', value: enterDuration }),
      );
    }
    if (exitDuration >= 0) {
      webgalStore.dispatch(
        stageActions.updateAnimationSettings({ target: 'bg-main', key: 'exitDuration', value: exitDuration }),
      );
    }
  }

  /**
   * 背景状态后处理
   */
  function postBgStateSet() {
    if (isUrlChanged) {
      WebGAL.gameplay.performController.unmountPerform(`animation-bg-main`, true);
    }
  }

  postBgStateSet();
  dispatch(setStage({ key: 'bgName', value: sentence.content }));

  return {
    performName: `bg-main-${sentence.content}`,
    duration,
    isHoldOn: false,
    stopFunction: () => {
      WebGAL.gameplay.pixiStage?.stopPresetAnimationOnTarget('bg-main');
    },
    blockingNext: () => (type === 'blinds' ? true : false),
    blockingAuto: () => true,
    stopTimeout: undefined, // 暂时不用，后面会交给自动清理
  };
};
