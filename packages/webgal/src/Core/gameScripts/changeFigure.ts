import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage, stageActions } from '@/store/stageReducer';
import cloneDeep from 'lodash/cloneDeep';
import { getBooleanArgByKey, getNumberArgByKey, getStringArgByKey } from '@/Core/util/getSentenceArg';
import { IFreeFigure, IStageState, ITransform } from '@/store/stageInterface';
import { AnimationFrame, IUserAnimation } from '@/Core/Modules/animations';
import { generateTransformAnimationObj } from '@/Core/controller/stage/pixi/animations/generateTransformAnimationObj';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';
import { logger } from '@/Core/util/logger';
import { getAnimateDuration } from '@/Core/Modules/animationFunctions';
import { WebGAL } from '@/Core/WebGAL';
import { baseBlinkParam, baseFocusParam, BlinkParam, FocusParam } from '@/Core/live2DCore';
import { DEFAULT_FIG_IN_DURATION, DEFAULT_FIG_OUT_DURATION, WEBGAL_NONE } from '../constants';
/**
 * 更改立绘
 * @param sentence 语句
 */
// eslint-disable-next-line complexity
export function changeFigure(sentence: ISentence): IPerform {
  // 语句内容
  let content = sentence.content;
  if (content === WEBGAL_NONE) {
    content = '';
  }
  if (getBooleanArgByKey(sentence, 'clear')) {
    content = '';
  }

  // 根据参数设置指定位置
  let pos: 'center' | 'left' | 'right' = 'center';
  let mouthAnimationKey = 'mouthAnimation';
  let eyesAnimationKey = 'blinkAnimation';
  const leftFromArgs = getBooleanArgByKey(sentence, 'left') ?? false;
  const rightFromArgs = getBooleanArgByKey(sentence, 'right') ?? false;
  if (leftFromArgs) {
    pos = 'left';
    mouthAnimationKey = 'mouthAnimationLeft';
    eyesAnimationKey = 'blinkAnimationLeft';
  }
  if (rightFromArgs) {
    pos = 'right';
    mouthAnimationKey = 'mouthAnimationRight';
    eyesAnimationKey = 'blinkAnimationRight';
  }

  // id 与自由立绘
  let key = getStringArgByKey(sentence, 'id') ?? '';
  const isFreeFigure = key ? true : false;
  const id = key ? key : `fig-${pos}`;

  // live2d 或 spine 相关
  let motion = getStringArgByKey(sentence, 'motion') ?? '';
  let expression = getStringArgByKey(sentence, 'expression') ?? '';

  // WebGAL Mano 特殊处理：pose
  const isWebgalMano = content.includes('type=webgal_mano');
  if (isWebgalMano) {
    motion = '';
    expression = '';
  }
  let manoPoses: string[] = [];
  if (isWebgalMano) {
    const poseArg = getStringArgByKey(sentence, 'pose');
    if (poseArg) {
      manoPoses = parseManoPoseArg(poseArg);
    }
    const poses = sentence.args
      .filter(
        (arg) => arg.value === true && !['left', 'right', 'next', 'clear', 'center', 'id', 'pose'].includes(arg.key),
      )
      .map((arg) => arg.key);
    manoPoses = manoPoses.concat(poses).filter(Boolean);

    if (manoPoses.length > 0) {
      motion = manoPoses.join(',');
      expression = '';
    }
  }

  const boundsFromArgs = getStringArgByKey(sentence, 'bounds') ?? '';
  let bounds = getOverrideBoundsArr(boundsFromArgs);

  let blink: BlinkParam | null = null;
  const blinkFromArgs = getStringArgByKey(sentence, 'blink');
  if (blinkFromArgs) {
    try {
      blink = JSON.parse(blinkFromArgs) as BlinkParam;
    } catch (error) {
      logger.error('Failed to parse blink parameter:', error);
    }
  }

  let focus: FocusParam | null = null;
  const focusFromArgs = getStringArgByKey(sentence, 'focus');
  if (focusFromArgs) {
    try {
      focus = JSON.parse(focusFromArgs) as FocusParam;
    } catch (error) {
      logger.error('Failed to parse focus parameter:', error);
    }
  }

  // 图片立绘差分
  const mouthOpen = assetSetter(getStringArgByKey(sentence, 'mouthOpen') ?? '', fileType.figure);
  const mouthClose = assetSetter(getStringArgByKey(sentence, 'mouthClose') ?? '', fileType.figure);
  const mouthHalfOpen = assetSetter(getStringArgByKey(sentence, 'mouthHalfOpen') ?? '', fileType.figure);
  const eyesOpen = assetSetter(getStringArgByKey(sentence, 'eyesOpen') ?? '', fileType.figure);
  const eyesClose = assetSetter(getStringArgByKey(sentence, 'eyesClose') ?? '', fileType.figure);
  const animationFlag = getStringArgByKey(sentence, 'animationFlag') ?? '';

  // 其他参数
  const transformString = getStringArgByKey(sentence, 'transform');
  const ease = getStringArgByKey(sentence, 'ease') ?? '';
  const durationArg = getNumberArgByKey(sentence, 'duration');
  let duration = durationArg ?? DEFAULT_FIG_IN_DURATION;
  const enterAnimation = getStringArgByKey(sentence, 'enter');
  const exitAnimation = getStringArgByKey(sentence, 'exit');
  let zIndex = getNumberArgByKey(sentence, 'zIndex') ?? -1;
  const enterDuration = getNumberArgByKey(sentence, 'enterDuration') ?? duration;
  duration = enterDuration;
  const exitDuration = getNumberArgByKey(sentence, 'exitDuration') ?? DEFAULT_FIG_OUT_DURATION;

  // 视频形式立绘，允许 'true' | 'false' | 'disappear'
  const loopArg = getStringArgByKey(sentence, 'loop') ?? 'true';

  // LUT 参数
  const lutArg = getStringArgByKey(sentence, 'lut');
  if (lutArg !== null) {
    if (lutArg === '') {
      webgalStore.dispatch(stageActions.setFigureMetaData([id, 'lut', '', false]));
    } else {
      webgalStore.dispatch(stageActions.setFigureMetaData([id, 'lut', assetSetter(lutArg, fileType.lut), false]));
    }
  }

  const dispatch = webgalStore.dispatch;

  const currentFigureAssociatedAnimation = webgalStore.getState().stage.figureAssociatedAnimation;
  const filteredFigureAssociatedAnimation = currentFigureAssociatedAnimation.filter((item) => item.targetId !== id);
  const newFigureAssociatedAnimationItem = {
    targetId: id,
    animationFlag: animationFlag,
    mouthAnimation: {
      open: mouthOpen,
      close: mouthClose,
      halfOpen: mouthHalfOpen,
    },
    blinkAnimation: {
      open: eyesOpen,
      close: eyesClose,
    },
  };
  filteredFigureAssociatedAnimation.push(newFigureAssociatedAnimationItem);
  dispatch(setStage({ key: 'figureAssociatedAnimation', value: filteredFigureAssociatedAnimation }));

  /**
   * 如果 url 没变，不移除
   */
  let isUrlChanged = true;
  if (key !== '') {
    const figWithKey = webgalStore.getState().stage.freeFigure.find((e) => e.key === key);
    if (figWithKey) {
      if (figWithKey.name === sentence.content) {
        isUrlChanged = false;
      }
    }
  } else {
    if (pos === 'center') {
      if (webgalStore.getState().stage.figName === sentence.content) {
        isUrlChanged = false;
      }
    }
    if (pos === 'left') {
      if (webgalStore.getState().stage.figNameLeft === sentence.content) {
        isUrlChanged = false;
      }
    }
    if (pos === 'right') {
      if (webgalStore.getState().stage.figNameRight === sentence.content) {
        isUrlChanged = false;
      }
    }
  }
  /**
   * 处理 Effects
   */
  if (isUrlChanged) {
    webgalStore.dispatch(stageActions.removeEffectByTargetId(id));
    webgalStore.dispatch(stageActions.removeAnimationSettingsByTarget(id));
    const oldStageObject = WebGAL.gameplay.pixiStage?.getStageObjByKey(id);
    if (oldStageObject) {
      oldStageObject.isExiting = true;
    }
  }
  const setAnimationNames = (key: string, sentence: ISentence) => {
    let animationObj: AnimationFrame[];
    if (transformString) {
      try {
        const frame = JSON.parse(transformString) as AnimationFrame;
        animationObj = generateTransformAnimationObj(key, frame, duration, ease);
        animationObj[0].alpha = 0;
        const animationName = (Math.random() * 10).toString(16);
        const newAnimation: IUserAnimation = { name: animationName, effects: animationObj };
        WebGAL.animationManager.addAnimation(newAnimation);
        duration = getAnimateDuration(animationName);
        WebGAL.animationManager.nextEnterAnimationName.set(key, animationName);
        WebGAL.animationManager.nextEnterAnimationDuration.set(key, duration);
        webgalStore.dispatch(
          stageActions.updateAnimationSettings({ target: key, key: 'enterAnimationName', value: animationName }),
        );
      } catch (e) {
        applyDefaultTransform();
      }
    } else {
      applyDefaultTransform();
    }

    function applyDefaultTransform() {
      const frame = {};
      animationObj = generateTransformAnimationObj(key, frame as AnimationFrame, duration, ease);
      animationObj[0].alpha = 0;
      const animationName = (Math.random() * 10).toString(16);
      const newAnimation: IUserAnimation = { name: animationName, effects: animationObj };
      WebGAL.animationManager.addAnimation(newAnimation);
      duration = getAnimateDuration(animationName);
      WebGAL.animationManager.nextEnterAnimationName.set(key, animationName);
      WebGAL.animationManager.nextEnterAnimationDuration.set(key, duration);
      webgalStore.dispatch(
        stageActions.updateAnimationSettings({ target: key, key: 'enterAnimationName', value: animationName }),
      );
    }

    if (enterAnimation) {
      WebGAL.animationManager.nextEnterAnimationName.set(key, enterAnimation);
      duration = getAnimateDuration(enterAnimation);
      webgalStore.dispatch(
        stageActions.updateAnimationSettings({ target: key, key: 'enterAnimationName', value: enterAnimation }),
      );
    }
    if (exitAnimation) {
      WebGAL.animationManager.nextExitAnimationName.set(key + '-off', exitAnimation);
      duration = getAnimateDuration(exitAnimation);
      webgalStore.dispatch(
        stageActions.updateAnimationSettings({ target: key, key: 'exitAnimationName', value: exitAnimation }),
      );
    }
    if (enterDuration >= 0) {
      webgalStore.dispatch(
        stageActions.updateAnimationSettings({ target: key, key: 'enterDuration', value: enterDuration }),
      );
    }
    if (exitDuration >= 0) {
      webgalStore.dispatch(
        stageActions.updateAnimationSettings({ target: key, key: 'exitDuration', value: exitDuration }),
      );
    }
  };

  function postFigureStateSet() {
    if (isUrlChanged) {
      bounds = bounds ?? [0, 0, 0, 0];
      blink = blink ?? cloneDeep(baseBlinkParam);
      focus = focus ?? cloneDeep(baseFocusParam);
      zIndex = Math.max(zIndex, 0);
      dispatch(stageActions.setLive2dMotion({ target: key, motion, overrideBounds: bounds }));
      dispatch(stageActions.setLive2dExpression({ target: key, expression }));
      dispatch(stageActions.setLive2dBlink({ target: key, blink }));
      dispatch(stageActions.setLive2dFocus({ target: key, focus }));
      dispatch(stageActions.setFigureMetaData([key, 'zIndex', zIndex, false]));
      dispatch(stageActions.setFigureMetaData([key, 'loop', loopArg, false]));
      WebGAL.gameplay.performController.unmountPerform(`animation-${key}`, true);
    } else {
      if (motion || bounds) {
        dispatch(stageActions.setLive2dMotion({ target: key, motion, overrideBounds: bounds }));
      }
      if (expression) {
        dispatch(stageActions.setLive2dExpression({ target: key, expression }));
      }
      if (blink) {
        dispatch(stageActions.setLive2dBlink({ target: key, blink }));
      }
      if (focus) {
        dispatch(stageActions.setLive2dFocus({ target: key, focus }));
      }
      if (zIndex >= 0) {
        dispatch(stageActions.setFigureMetaData([key, 'zIndex', zIndex, false]));
      }
      dispatch(stageActions.setFigureMetaData([key, 'loop', loopArg, false]));
    }
  }

  if (isFreeFigure) {
    const freeFigureItem: IFreeFigure = { key: id, name: content, basePosition: pos };
    setAnimationNames(id, sentence);
    postFigureStateSet();
    dispatch(stageActions.setFreeFigureByKey(freeFigureItem));
  } else {
    const positionMap = {
      center: 'fig-center',
      left: 'fig-left',
      right: 'fig-right',
    };
    const dispatchMap: Record<string, keyof IStageState> = {
      center: 'figName',
      left: 'figNameLeft',
      right: 'figNameRight',
    };

    key = positionMap[pos];
    setAnimationNames(key, sentence);
    postFigureStateSet();
    dispatch(setStage({ key: dispatchMap[pos], value: content }));
  }

  return {
    performName: `enter-${key}`,
    duration,
    isHoldOn: false,
    stopFunction: () => {
      WebGAL.gameplay.pixiStage?.stopPresetAnimationOnTarget(key);
    },
    blockingNext: () => false,
    blockingAuto: () => true,
    stopTimeout: undefined, // 暂时不用，后面会交给自动清理
  };
}

function parseManoPoseArg(arg: string): string[] {
  return arg
    .replace(/^\{|\}$/g, '')
    .split(',')
    .map((pose) => pose.trim())
    .filter(Boolean);
}

function getOverrideBoundsArr(boundsFromArgs: string | undefined | null): [number, number, number, number] | undefined {
  if (!boundsFromArgs) return undefined;
  try {
    const arr = JSON.parse(boundsFromArgs) as [number, number, number, number];
    if (Array.isArray(arr) && arr.length === 4 && arr.every((v) => typeof v === 'number')) {
      return arr;
    }
  } catch (e) {
    // fallback to comma-separated format
  }
  const parts = boundsFromArgs.split(',').map((e) => Number(e.trim()));
  if (parts.length === 4 && parts.every((v) => !isNaN(v))) {
    return parts as [number, number, number, number];
  }
  return undefined;
}
