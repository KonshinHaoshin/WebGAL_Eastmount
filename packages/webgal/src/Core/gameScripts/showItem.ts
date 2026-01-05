import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { getStringArgByKey } from '@/Core/util/getSentenceArg';
import { logger } from '@/Core/util/logger';
import { getValueFromStateElseKey } from './setVar';
import { itemManager } from '@/Core/Modules/item/itemManager';
import { setVisibility } from '@/store/GUIReducer';

// 用于管理隐藏计时器
let hideTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 显示物品提示（只显示物品图片，不显示魔女图鉴更新图片）
 */
function showItemHint(itemId: string, itemName: string, itemImage: string) {
  // 触发物品显示提示，使用新的组件名称
  webgalStore.dispatch(
    setVisibility({
      component: 'showItem',
      visibility: true,
      itemInfo: {
        itemId,
        itemName,
        itemImage,
      },
    }),
  );

  // 清除之前的计时器（如果存在）
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  // 4.5秒后自动隐藏提示（组件4秒后开始淡出，加上0.5秒动画时间）
  hideTimer = setTimeout(() => {
    webgalStore.dispatch(setVisibility({ component: 'showItem', visibility: false }));
    hideTimer = null;
  }, 4500);
}

/**
 * 显示物品提示（不添加到仓库）
 * 用法: showItem:itemId=sword
 * 或: showItem:sword
 */
export const showItem = (sentence: ISentence): IPerform => {
  const itemId = getStringArgByKey(sentence, 'itemId') || sentence.content;

  // 支持变量解析
  const resolvedItemId = getValueFromStateElseKey(itemId, true);

  // 尝试加载物品定义
  itemManager.loadItem(String(resolvedItemId)).then((itemDef) => {
    if (itemDef) {
      // 显示物品提示，传递物品信息
      showItemHint(String(resolvedItemId), itemDef.name, itemDef.image);
      logger.debug(`显示物品提示: ${itemDef.name} (${resolvedItemId})`);
    } else {
      // 如果无法加载物品定义，使用默认信息
      const name = getStringArgByKey(sentence, 'name') || String(resolvedItemId);
      const image = getStringArgByKey(sentence, 'image') || './game/Item/ansk/128x128.png';

      // 显示物品提示，使用提供的或默认的信息
      showItemHint(String(resolvedItemId), name, image);
      logger.debug(`显示物品提示（无定义）: ${name} (${resolvedItemId})`);
    }
  });

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
