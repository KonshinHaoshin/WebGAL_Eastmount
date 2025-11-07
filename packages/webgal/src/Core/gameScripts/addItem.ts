import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { addInventoryItem } from '@/store/stageReducer';
import { getStringArgByKey, getNumberArgByKey } from '@/Core/util/getSentenceArg';
import { logger } from '@/Core/util/logger';
import { getValueFromStateElseKey } from './setVar';
import { itemManager } from '@/Core/Modules/item/itemManager';

/**
 * 添加物品到仓库
 * 用法: addItem:itemId=sword
 */
export const addItem = (sentence: ISentence): IPerform => {
  const itemId = getStringArgByKey(sentence, 'itemId') || sentence.content;
  
  // 支持变量解析
  const resolvedItemId = getValueFromStateElseKey(itemId, true);
  const count = getNumberArgByKey(sentence, 'count') ?? 1;
  const resolvedCount = typeof count === 'string' ? Number(getValueFromStateElseKey(count, true)) : count;
  
  // 尝试加载物品定义（如果还未加载）
  itemManager.loadItem(String(resolvedItemId)).then((itemDef) => {
    if (itemDef) {
      // 添加物品到仓库
      webgalStore.dispatch(addInventoryItem({
        itemId: String(resolvedItemId),
        count: resolvedCount,
        name: itemDef.name,
      }));
      logger.debug(`添加物品到仓库: ${itemDef.name} (${resolvedItemId}) x${resolvedCount}`);
    } else {
      // 如果无法加载物品定义，尝试直接添加（需要提供名称）
      const name = getStringArgByKey(sentence, 'name') || String(resolvedItemId);
      webgalStore.dispatch(addInventoryItem({
        itemId: String(resolvedItemId),
        count: resolvedCount,
        name: name,
      }));
      logger.debug(`添加物品到仓库（无定义）: ${name} (${resolvedItemId}) x${resolvedCount}`);
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

