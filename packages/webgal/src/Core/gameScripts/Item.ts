import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { getBooleanArgByKey, getNumberArgByKey, getStringArgByKey } from '@/Core/util/getSentenceArg';
import { logger } from '@/Core/util/logger';
import { WebGAL } from '@/Core/WebGAL';
import { WEBGAL_NONE } from '../constants';
import { addInventoryItem, stageActions } from '@/store/stageReducer';
import { getValueFromStateElseKey } from './setVar';
import { itemManager } from '@/Core/Modules/item/itemManager';
import { AnimationFrame } from '@/Core/Modules/animations';
import { ITransform } from '@/store/stageInterface';
import PixiStage from '@/Core/controller/stage/pixi/PixiController';

/**
 * 在舞台上显示物品（可交互选择）
 * 用法: Item:ansk -transform={} -left -next
 * 支持位置参数：-left, -right, -center
 * 支持 id 参数：-id=item-1
 */
// eslint-disable-next-line complexity
export function Item(sentence: ISentence): IPerform {
  // 从 content 中获取物品ID
  let itemId = sentence.content.trim();
  if (itemId === WEBGAL_NONE || itemId === '') {
    logger.error('Item 命令需要指定物品ID');
    return {
      performName: 'Item-error',
      duration: 0,
      isHoldOn: false,
      stopFunction: () => {},
      blockingNext: () => false,
      blockingAuto: () => true,
      stopTimeout: undefined,
    };
  }

  // 支持变量解析
  const resolvedItemId = getValueFromStateElseKey(itemId, true);
  const itemIdStr = String(resolvedItemId);

  // 根据参数设置指定位置
  let pos: 'center' | 'left' | 'right' = 'center';
  const leftFromArgs = getBooleanArgByKey(sentence, 'left') ?? false;
  const rightFromArgs = getBooleanArgByKey(sentence, 'right') ?? false;
  if (leftFromArgs) {
    pos = 'left';
  }
  if (rightFromArgs) {
    pos = 'right';
  }

  // id 参数，如果没有指定则使用 item-{itemId}
  let key = getStringArgByKey(sentence, 'id') ?? `item-${itemIdStr}`;

  // 其他参数
  const transformString = getStringArgByKey(sentence, 'transform');
  let zIndex = getNumberArgByKey(sentence, 'zIndex') ?? -1;

  const dispatch = webgalStore.dispatch;

  // 获取物品定义
  itemManager.loadItem(itemIdStr).then((itemDef) => {
    if (!itemDef) {
      logger.error(`物品不存在: ${itemIdStr}`);
      return;
    }

    // 使用物品的 image 作为内容
    // itemDef.image 已经是完整路径（如 ./game/Item/ansk/128x128.png）
    let content = itemDef.image;
    if (content === WEBGAL_NONE || getBooleanArgByKey(sentence, 'clear')) {
      // 如果 clear，移除 item
      WebGAL.gameplay.pixiStage?.removeItemObjectByKey(key);
      return;
    }

    // 使用独立的 itemContainer 添加 item
    WebGAL.gameplay.pixiStage?.addItem(key, content, pos);

    // 设置 zIndex
    function setItemData() {
      zIndex = Math.max(zIndex, 0);
      dispatch(stageActions.setFigureMetaData([key, 'zIndex', zIndex, false]));
    }

    setItemData();

    // 如果指定了 transform，创建 effect 并立即应用
    if (transformString) {
      try {
        const frame = JSON.parse(transformString) as AnimationFrame;
        // 创建 effect
        dispatch(
          stageActions.updateEffect({
            target: key,
            transform: {
              ...frame,
              position: frame.position || { x: 0, y: 0 },
              scale: frame.scale || { x: 1, y: 1 },
            },
          }),
        );
      } catch (e) {
        logger.error(`解析 transform 参数失败: ${transformString}`, e);
      }
    }

    // 等待 item 创建后，立即应用 transform（如果指定了）
    setTimeout(() => {
      const itemObj = WebGAL.gameplay.pixiStage?.getItemObjByKey(key);
      if (itemObj && transformString) {
        try {
          const frame = JSON.parse(transformString) as AnimationFrame;
          const effects = webgalStore.getState().stage.effects;
          const effect = effects.find((e) => e.target === key);
          if (effect?.transform) {
            const container = itemObj.pixiContainer;
            // 将 position: {x, y} 转换为 {x, y}，因为 WebGALPixiContainer 使用 x 和 y 属性
            // 参考 useSetEffects.ts 中的 convertTransform 函数
            const { position, ...rest } = effect.transform;
            const transformToApply = {
              ...rest,
              x: position?.x ?? 0,
              y: position?.y ?? 0,
            };
            // @ts-ignore assignTransform 实际上接受 {x, y} 格式，而不是 ITransform
            PixiStage.assignTransform(container, transformToApply);
          }
        } catch (e) {
          logger.error(`应用 transform 失败: ${transformString}`, e);
        }
      }
    }, 100);

    // 设置物品交互 - 使用轮询等待 item 加载完成
    const setupInteraction = () => {
      let attempts = 0;
      const maxAttempts = 50; // 最多尝试 50 次（5秒）
      const checkInterval = setInterval(() => {
        attempts++;
        // 使用 getItemObjByKey 查找 item 对象
        const itemObj = WebGAL.gameplay.pixiStage?.getItemObjByKey(key);
        if (itemObj?.pixiContainer) {
          // 找到 sprite（可能在 container 的 children 中）
          let sprite: any = null;
          for (const child of itemObj.pixiContainer.children) {
            if (child && 'texture' in child) {
              sprite = child;
              break;
            }
          }

          if (sprite && 'interactive' in sprite) {
            clearInterval(checkInterval);
            sprite.interactive = true;
            sprite.cursor = 'pointer';

            // 点击事件
            sprite.on('pointerdown', () => {
              // 显示物品详情查看器
              dispatch(stageActions.setViewingItemId(itemIdStr));

              logger.debug(`查看物品: ${itemDef.name} (${itemIdStr})`);
            });

            // 鼠标悬停效果
            sprite.on('pointerover', () => {
              if ('scale' in sprite && sprite.scale) {
                const currentScale = sprite.scale.x || 1;
                sprite.scale.set(currentScale * 1.05);
              }
            });
            sprite.on('pointerout', () => {
              if ('scale' in sprite && sprite.scale) {
                const currentScale = sprite.scale.x || 1;
                sprite.scale.set(currentScale / 1.05);
              }
            });
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          logger.warn(`无法为物品 ${itemIdStr} 设置交互：item 加载超时`);
        }
      }, 100);
    };

    setupInteraction();
  });

  return {
    performName: `Item-${itemIdStr}`,
    duration: 0,
    isHoldOn: false,
    stopFunction: () => {
      WebGAL.gameplay.pixiStage?.removeItemObjectByKey(key);
    },
    blockingNext: () => false,
    blockingAuto: () => true,
    stopTimeout: undefined,
  };
}
