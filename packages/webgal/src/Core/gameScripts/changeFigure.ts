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
import { WEBGAL_NONE } from '../constants';
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

  // id 与 自由立绘
  let key = getStringArgByKey(sentence, 'id') ?? '';
  const isFreeFigure = key ? true : false;
  const id = key ? key : `fig-${pos}`;

  // live2d 或 spine 相关
  let motion = getStringArgByKey(sentence, 'motion') ?? '';
  let expression = getStringArgByKey(sentence, 'expression') ?? '';
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
  let duration = getNumberArgByKey(sentence, 'duration') ?? 50;
  const enterAnimation = getStringArgByKey(sentence, 'enter');
  const exitAnimation = getStringArgByKey(sentence, 'exit');
  let zIndex = getNumberArgByKey(sentence, 'zIndex') ?? -1;

  // 视频形式立绘，允许 'true' | 'false' | 'disappear'
  const loopArg = getStringArgByKey(sentence, 'loop') ?? 'true';

  // LUT 参数
  const lutArg = getStringArgByKey(sentence, 'lut');
  console.log('[LUT Debug] changeFigure LUT arg:', { lutArg, lutArgType: typeof lutArg, lutArgLength: lutArg?.length });
  if (lutArg !== null) {
    if (lutArg === '') {
      // 明确传入空字符串，清除 LUT
      console.log('[LUT Debug] Setting lut to empty string to clear LUT');
      webgalStore.dispatch(stageActions.setFigureMetaData([id, 'lut', '', false]));
    } else {
      // 传入具体的 LUT 文件路径
      console.log('[LUT Debug] Setting lut to file path:', lutArg);
      webgalStore.dispatch(stageActions.setFigureMetaData([id, 'lut', assetSetter(lutArg, fileType.lut), false]));
    }
  } else {
    console.log('[LUT Debug] No lut parameter, keeping existing LUT');
  }
  // 如果没有 -lut 参数，保持现有 LUT 不变

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
    const oldStageObject = WebGAL.gameplay.pixiStage?.getStageObjByKey(id);
    if (oldStageObject) {
      oldStageObject.isExiting = true;
    }
  }
  const setAnimationNames = (key: string, sentence: ISentence) => {
    // 处理 transform 和 默认 transform
    let animationObj: AnimationFrame[];
    if (transformString) {
      console.log(transformString);
      try {
        const frame = JSON.parse(transformString) as AnimationFrame;
        animationObj = generateTransformAnimationObj(key, frame, duration, ease);
        const animationName = (Math.random() * 10).toString(16);
        const newAnimation: IUserAnimation = { name: animationName, effects: animationObj };
        WebGAL.animationManager.addAnimation(newAnimation);
        duration = getAnimateDuration(animationName);
        WebGAL.animationManager.nextEnterAnimationName.set(key, animationName);
      } catch (e) {
        // 解析都错误了，歇逼吧
        applyDefaultTransform();
      }
    } else {
      applyDefaultTransform();
    }

    function applyDefaultTransform() {
      // 应用默认的
      const frame = {};
      animationObj = generateTransformAnimationObj(key, frame as AnimationFrame, duration, ease);
      const animationName = (Math.random() * 10).toString(16);
      const newAnimation: IUserAnimation = { name: animationName, effects: animationObj };
      WebGAL.animationManager.addAnimation(newAnimation);
      duration = getAnimateDuration(animationName);
      WebGAL.animationManager.nextEnterAnimationName.set(key, animationName);
    }

    if (enterAnimation) {
      WebGAL.animationManager.nextEnterAnimationName.set(key, enterAnimation);
      duration = getAnimateDuration(enterAnimation);
    }
    if (exitAnimation) {
      WebGAL.animationManager.nextExitAnimationName.set(key + '-off', exitAnimation);
      duration = getAnimateDuration(exitAnimation);
    }
  };

  function setFigureData() {
    if (isUrlChanged) {
      // 当 url 发生变化时，即发生新立绘替换
      // 应当赋予一些参数以默认值，防止从旧立绘的状态获取数据
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
    } else {
      // 当 url 没有发生变化时，即没有新立绘替换
      // 应当保留旧立绘的状态，仅在需要时更新
      if (motion || bounds) {
        dispatch(stageActions.setLive2dMotion({ target: key, motion, overrideBounds: bounds }));
      }
      if (expression) {
        dispatch(stageActions.setLive2dExpression({ target: key, expression }));
      }
    }
  }

  if (isFreeFigure) {
    // 在这里设置自由立绘
    const freeFigure = webgalStore.getState().stage.freeFigure;
    const currentFigureCount = freeFigure.filter((e) => e.key === id).length;

    let figPos: 'center' | 'left' | 'right' = 'center';
    if (pos === 'center') figPos = 'center';
    if (pos === 'left') figPos = 'left';
    if (pos === 'right') figPos = 'right';
    if (currentFigureCount === 0) {
      dispatch(stageActions.setFreeFigureByKey({ basePosition: figPos, key: id, name: content } satisfies IFreeFigure));
    } else {
      dispatch(stageActions.setFreeFigureByKey({ basePosition: figPos, key: id, name: content } satisfies IFreeFigure));
    }
    setAnimationNames(id, sentence);
    setFigureData();
  } else {
    if (pos === 'center') {
      dispatch(setStage({ key: 'figName', value: content }));
      setAnimationNames('fig-center', sentence);
    } else if (pos === 'left') {
      dispatch(setStage({ key: 'figNameLeft', value: content }));
      setAnimationNames('fig-left', sentence);
    } else if (pos === 'right') {
      dispatch(setStage({ key: 'figNameRight', value: content }));
      setAnimationNames('fig-right', sentence);
    }
    setFigureData();
  }

  return {
    performName: `changeFigure-${sentence.content}`,
    duration,
    isHoldOn: false,
    stopFunction: () => {
      WebGAL.gameplay.pixiStage?.stopPresetAnimationOnTarget(id);
    },
    blockingNext: () => false,
    blockingAuto: () => true,
    stopTimeout: undefined, // 暂时不用，后面会交给自动清除
  };
}

function getOverrideBoundsArr(boundsFromArgs: string | undefined | null): [number, number, number, number] | undefined {
  if (!boundsFromArgs) return undefined;
  // Try JSON array first
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
