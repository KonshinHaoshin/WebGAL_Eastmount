import { generateUniversalSoftInAnimationObj } from '@/Core/controller/stage/pixi/animations/universalSoftIn';
import { logger } from '@/Core/util/logger';
import { generateUniversalSoftOffAnimationObj } from '@/Core/controller/stage/pixi/animations/universalSoftOff';
import { webgalStore } from '@/store/store';
import cloneDeep from 'lodash/cloneDeep';
import { baseTransform } from '@/store/stageInterface';
import { generateTimelineObj } from '@/Core/controller/stage/pixi/animations/timeline';
import { WebGAL } from '@/Core/WebGAL';
import PixiStage, { IAnimationObject } from '@/Core/controller/stage/pixi/PixiController';
import { webgalAnimations } from '@/Core/controller/stage/pixi/animations';
import {
  DEFAULT_BG_IN_DURATION,
  DEFAULT_BG_OUT_DURATION,
  DEFAULT_FIG_IN_DURATION,
  DEFAULT_FIG_OUT_DURATION,
} from '../constants';

// eslint-disable-next-line max-params
export function getAnimationObject(animationName: string, target: string, duration: number, writeDefault: boolean) {
  // 先尝试从预设动画中找
  const presetAnimation = webgalAnimations.find((ani) => ani.name === animationName);
  if (presetAnimation) {
    return presetAnimation.animationGenerateFunc(target, duration);
  }

  const effect = WebGAL.animationManager.getAnimations().find((ani) => ani.name === animationName);
  if (effect) {
    const mappedEffects = effect.effects.map((effect) => {
      const targetSetEffect = webgalStore.getState().stage.effects.find((e) => e.target === target);
      let newEffect;

      if (!writeDefault && targetSetEffect && targetSetEffect.transform) {
        newEffect = cloneDeep({ ...targetSetEffect.transform, duration: 0, ease: '' });
      } else {
        newEffect = cloneDeep({ ...baseTransform, duration: 0, ease: '' });
      }

      PixiStage.assignTransform(newEffect, effect);
      newEffect.duration = effect.duration;
      newEffect.ease = effect.ease;
      return newEffect;
    });
    logger.debug('装载自定义动画', mappedEffects);
    return generateTimelineObj(mappedEffects, target, duration);
  }
  return null;
}

export function getAnimateDuration(animationName: string) {
  // 先尝试从预设动画中找
  const presetAnimation = webgalAnimations.find((ani) => ani.name === animationName);
  if (presetAnimation) {
    return 1000; // 预设动画的默认持续时间
  }
  const effect = WebGAL.animationManager.getAnimations().find((ani) => ani.name === animationName);
  if (effect) {
    let duration = 0;
    effect.effects.forEach((e) => {
      duration += e.duration;
    });
    return duration;
  }
  return 0;
}

// eslint-disable-next-line max-params
export function getEnterExitAnimation(
  target: string,
  type: 'enter' | 'exit',
  isBg = false,
  realTarget?: string, // 用于立绘和背景移除时，以当前时间打上特殊标记
): {
  duration: number;
  animation: IAnimationObject | null;
} {
  if (type === 'enter') {
    let duration = isBg ? DEFAULT_BG_IN_DURATION : DEFAULT_FIG_IN_DURATION;
    duration =
      webgalStore.getState().stage.animationSettings.find((setting) => setting.target === target)?.enterDuration ??
      duration;
    let animation: IAnimationObject | null = generateUniversalSoftInAnimationObj(realTarget ?? target, duration);

    const transformState = webgalStore.getState().stage.effects;
    const targetEffect = transformState.find((effect) => effect.target === target);

    const animarionName = WebGAL.animationManager.nextEnterAnimationName.get(target);
    if (animarionName && !targetEffect) {
      logger.debug('取代默认进入动画', target);
      duration = WebGAL.animationManager.nextEnterAnimationDuration.get(target) ?? getAnimateDuration(animarionName);
      animation = getAnimationObject(animarionName, realTarget ?? target, duration, false);
      WebGAL.animationManager.nextEnterAnimationName.delete(target);
      WebGAL.animationManager.nextEnterAnimationDuration.delete(target);
      return { duration, animation };
    }

    const animationName = webgalStore
      .getState()
      .stage.animationSettings.find((setting) => setting.target === target)?.enterAnimationName;
    if (animationName && !targetEffect) {
      logger.debug('取代默认进入动画', target);
      const animDuration = getAnimateDuration(animationName);
      if (animDuration > 0) duration = animDuration;
      animation = getAnimationObject(animationName, realTarget ?? target, duration, false);
    }
    return { duration, animation };
  }

  // exit
  let duration = isBg ? DEFAULT_BG_OUT_DURATION : DEFAULT_FIG_OUT_DURATION;
  duration =
    webgalStore.getState().stage.animationSettings.find((setting) => setting.target + '-off' === target)?.exitDuration ??
    duration;
  let animation: IAnimationObject | null = generateUniversalSoftOffAnimationObj(realTarget ?? target, duration);
  const animarionName = WebGAL.animationManager.nextExitAnimationName.get(target);
  if (animarionName) {
    logger.debug('取代默认退出动画', target);
    duration = WebGAL.animationManager.nextExitAnimationDuration.get(target) ?? getAnimateDuration(animarionName);
    animation = getAnimationObject(animarionName, realTarget ?? target, duration, false);
    WebGAL.animationManager.nextExitAnimationName.delete(target);
    WebGAL.animationManager.nextExitAnimationDuration.delete(target);
    return { duration, animation };
  }
  const animationName = webgalStore
    .getState()
    .stage.animationSettings.find((setting) => setting.target + '-off' === target)?.exitAnimationName;
  if (animationName) {
    logger.debug('取代默认退出动画', target);
    const animDuration = getAnimateDuration(animationName);
    if (animDuration > 0) duration = animDuration;
    animation = getAnimationObject(animationName, realTarget ?? target, duration, false);
  }
  return { duration, animation };
}
