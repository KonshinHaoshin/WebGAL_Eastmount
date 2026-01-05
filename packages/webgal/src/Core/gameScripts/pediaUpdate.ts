import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { getStringArgByKey } from '@/Core/util/getSentenceArg';
import { logger } from '@/Core/util/logger';
import { setVisibility } from '@/store/GUIReducer';

// 用于管理隐藏计时器
let hideTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 显示魔女图鉴更新提示
 */
function showPediaUpdateHint() {
  // 触发魔女图鉴更新提示，但不传递物品信息
  // 这样ManopediaUpdate组件只会显示提示图片，不会显示物品展示
  webgalStore.dispatch(
    setVisibility({
      component: 'showManopediaUpdate',
      visibility: true,
      // 不传递itemInfo，这样组件就不会显示物品图片
    }),
  );

  // 清除之前的计时器（如果存在）
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  // 4.5秒后自动隐藏提示（组件4秒后开始淡出，加上0.5秒动画时间）
  hideTimer = setTimeout(() => {
    webgalStore.dispatch(setVisibility({ component: 'showManopediaUpdate', visibility: false }));
    hideTimer = null;
  }, 4500);
}

/**
 * 显示魔女图鉴更新提示
 * 用法: pediaUpdate:
 */
export const pediaUpdate = (sentence: ISentence): IPerform => {
  // 获取可选的参数
  const name = getStringArgByKey(sentence, 'name') || '图鉴更新';
  const image = getStringArgByKey(sentence, 'image') || './game/Item/ansk/128x128.png';

  // 显示魔女图鉴更新提示
  showPediaUpdateHint();
  logger.debug(`显示魔女图鉴更新提示: ${name}`);

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
