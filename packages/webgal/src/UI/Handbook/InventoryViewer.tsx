import { FC, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { stageActions, addInventoryItem } from '@/store/stageReducer';
import useSoundEffect from '@/hooks/useSoundEffect';
import { itemManager } from '@/Core/Modules/item/itemManager';
import { IItemDefinition } from '@/store/IItemDefinition';
import { WebGAL } from '@/Core/WebGAL';
import { WebgalParser, scriptRegistry, SCRIPT_TAG_MAP } from '@/Core/parser/sceneParser';
import { runScript } from '@/Core/controller/gamePlay/runScript';
import { logger } from '@/Core/util/logger';
import { getValueFromStateElseKey } from '@/Core/gameScripts/setVar';
import cloneDeep from 'lodash/cloneDeep';
import styles from './inventoryViewer.module.scss';

interface IInventoryViewerProps {
  onClose: () => void;
}

export const InventoryViewer: FC<IInventoryViewerProps> = ({ onClose }) => {
  const dispatch = useDispatch();
  const { playSeClick } = useSoundEffect();
  const inventory = useSelector((state: RootState) => state.stage.inventory);
  const [itemDefinitions, setItemDefinitions] = useState<Map<string, IItemDefinition>>(new Map());

  // 加载所有物品定义
  useEffect(() => {
    const loadItemDefinitions = async () => {
      const itemIds = Object.keys(inventory.items);
      const definitions = new Map<string, IItemDefinition>();
      
      for (const itemId of itemIds) {
        const itemDef = await itemManager.loadItem(itemId);
        if (itemDef) {
          definitions.set(itemId, itemDef);
        }
      }
      
      setItemDefinitions(definitions);
    };

    loadItemDefinitions();
  }, [inventory.items]);

  // 使用物品
  const handleUseItem = async (itemId: string) => {
    const itemDef = itemDefinitions.get(itemId);
    if (!itemDef || !itemDef.effects || itemDef.effects.length === 0) {
      logger.warn(`物品 ${itemId} 没有效果`);
      return;
    }

    // 依次执行所有 effects
    for (let i = 0; i < itemDef.effects.length; i++) {
      const effectString = itemDef.effects[i];
      try {
        // 使用 WebgalParser 解析效果字符串（每个 effect 是一行脚本）
        const parsedScene = WebgalParser.parse(effectString, `item-effect-${itemId}-${i}`, '');
        if (parsedScene.sentenceList.length > 0) {
          // 依次执行每个语句，等待前一个完成
          for (const sentence of parsedScene.sentenceList) {
            // 进行变量插值（替换 {变量名} 为实际值）
            const interpolatedSentence = cloneDeep(sentence);
            
            // 插值函数
            const interpolationOneItem = (content: string): string => {
              let retContent = content;
              const contentExp = retContent.match(/(?<!\\)\{(.*?)\}/g);
              
              if (contentExp !== null) {
                contentExp.forEach((e) => {
                  const contentVarValue = getValueFromStateElseKey(e.replace(/(?<!\\)\{(.*)\}/, '$1'));
                  retContent = retContent.replace(e, String(contentVarValue));
                });
              }
              retContent = retContent.replace(/\\{/g, '{').replace(/\\}/g, '}');
              return retContent;
            };
            
            // 对 content 进行插值
            interpolatedSentence.content = interpolationOneItem(interpolatedSentence.content);
            
            // 对 args 中的字符串值进行插值
            interpolatedSentence.args.forEach((arg) => {
              if (arg.value && typeof arg.value === 'string') {
                arg.value = interpolationOneItem(arg.value);
              }
            });
            
            // 直接调用脚本函数获取 perform
            const funcToRun = scriptRegistry[interpolatedSentence.command]?.scriptFunction ?? SCRIPT_TAG_MAP.say.scriptFunction;
            const perform = funcToRun(interpolatedSentence);
            
            // 将 perform 添加到 performController
            if (perform.arrangePerformPromise) {
              const resolvedPerform = await perform.arrangePerformPromise;
              WebGAL.gameplay.performController.arrangeNewPerform(resolvedPerform, interpolatedSentence);
              
              // 等待 perform 完成
              if (resolvedPerform.duration > 0) {
                await new Promise<void>((resolve) => {
                  const checkInterval = setInterval(() => {
                    const performExists = WebGAL.gameplay.performController.performList.find(
                      (p) => p.performName === resolvedPerform.performName
                    );
                    
                    // 如果 perform 不在列表中，说明已经完成
                    if (!performExists) {
                      clearInterval(checkInterval);
                      resolve();
                    }
                  }, 50);
                  
                  // 设置最大等待时间（duration + 100ms 缓冲）
                  setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                  }, resolvedPerform.duration + 100);
                });
              }
            } else {
              WebGAL.gameplay.performController.arrangeNewPerform(perform, interpolatedSentence);
              
              // 等待 perform 完成
              if (perform.duration > 0) {
                await new Promise<void>((resolve) => {
                  const checkInterval = setInterval(() => {
                    const performExists = WebGAL.gameplay.performController.performList.find(
                      (p) => p.performName === perform.performName
                    );
                    
                    // 如果 perform 不在列表中，说明已经完成
                    if (!performExists) {
                      clearInterval(checkInterval);
                      resolve();
                    }
                  }, 50);
                  
                  // 设置最大等待时间（duration + 100ms 缓冲）
                  setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                  }, perform.duration + 100);
                });
              }
            }
          }
        }
      } catch (error) {
        logger.error(`执行物品效果失败: ${effectString}`, error);
      }
    }

    // 如果是消耗品，减少数量
    if (itemDef.consumable !== false) {
      dispatch(
        addInventoryItem({
          itemId: itemId,
          count: -1,
          name: itemDef.name,
        }),
      );
    }

    playSeClick();
  };

  const inventoryItems = Object.values(inventory.items).filter((item) => item.count > 0);

  return (
    <div className={styles.inventoryContainer}>
      <h2 className={styles.inventoryTitle}>仓库</h2>
      <div className={styles.inventoryGrid}>
        {inventoryItems.length === 0 ? (
          <div className={styles.emptyMessage}>仓库为空</div>
        ) : (
          inventoryItems.map((item) => {
            const itemDef = itemDefinitions.get(item.id);
            if (!itemDef) {
              return null;
            }

            return (
              <div key={item.id} className={styles.inventoryItem} onClick={() => handleUseItem(item.id)}>
                {itemDef.icon && (
                  <img src={itemDef.icon} alt={itemDef.name} className={styles.itemIcon} />
                )}
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{itemDef.name}</div>
                  <div className={styles.itemCount}>数量: {item.count}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

