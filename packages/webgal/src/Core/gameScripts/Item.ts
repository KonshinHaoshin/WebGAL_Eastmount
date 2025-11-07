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
import { addInventoryItem } from '@/store/stageReducer';
import { getValueFromStateElseKey } from './setVar';
import { itemManager } from '@/Core/Modules/item/itemManager';

/**
 * 在舞台上显示物品（可交互选择）
 * 用法: Item:ansk -transform={} -left -next
 * 支持所有 changeFigure 的参数
 */
// eslint-disable-next-line complexity
export function Item(sentence: ISentence): IPerform {
  // 从 content 中获取物品ID（类似 changeFigure 的写法）
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

  // id 与 自由立绘
  let key = getStringArgByKey(sentence, 'id') ?? '';
  const isFreeFigure = key ? true : false;
  // 如果不是自由立绘，使用标准的 fig-left/fig-center/fig-right
  const id = key ? key : (pos === 'center' ? 'fig-center' : pos === 'left' ? 'fig-left' : 'fig-right');

  // 其他参数（和 changeFigure 一样）
  const transformString = getStringArgByKey(sentence, 'transform');
  const ease = getStringArgByKey(sentence, 'ease') ?? '';
  let duration = getNumberArgByKey(sentence, 'duration') ?? 50;
  const enterAnimation = getStringArgByKey(sentence, 'enter');
  const exitAnimation = getStringArgByKey(sentence, 'exit');
  let zIndex = getNumberArgByKey(sentence, 'zIndex') ?? -1;

  const dispatch = webgalStore.dispatch;

  // 获取物品定义
  itemManager.loadItem(itemIdStr).then((itemDef) => {
    if (!itemDef) {
      logger.error(`物品不存在: ${itemIdStr}`);
      return;
    }

    // 使用物品的 image 作为立绘内容
    // itemDef.image 已经是完整路径（如 ./game/Item/ansk/128x128.png）
    let content = itemDef.image;
    if (content === WEBGAL_NONE) {
      content = '';
    }
    if (getBooleanArgByKey(sentence, 'clear')) {
      content = '';
    }

    /**
     * 如果 url 没变，不移除
     */
    let isUrlChanged = true;
    if (key !== '') {
      const figWithKey = webgalStore.getState().stage.freeFigure.find((e) => e.key === key);
      if (figWithKey) {
        if (figWithKey.name === content) {
          isUrlChanged = false;
        }
      }
    } else {
      // 检查标准位置的立绘是否变化
      const currentFigName = pos === 'center' 
        ? webgalStore.getState().stage.figName
        : pos === 'left'
        ? webgalStore.getState().stage.figNameLeft
        : webgalStore.getState().stage.figNameRight;
      if (currentFigName === content) {
        isUrlChanged = false;
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
        try {
          const frame = JSON.parse(transformString) as AnimationFrame;
          animationObj = generateTransformAnimationObj(key, frame, duration, ease);
          const animationName = (Math.random() * 10).toString(16);
          const newAnimation: IUserAnimation = { name: animationName, effects: animationObj };
          WebGAL.animationManager.addAnimation(newAnimation);
          duration = getAnimateDuration(animationName);
          WebGAL.animationManager.nextEnterAnimationName.set(key, animationName);
        } catch (e) {
          applyDefaultTransform();
        }
      } else {
        applyDefaultTransform();
      }

      function applyDefaultTransform() {
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

    function setItemData() {
      if (isUrlChanged) {
        zIndex = Math.max(zIndex, 0);
        dispatch(stageActions.setFigureMetaData([id, 'zIndex', zIndex, false]));
      }
    }

    if (isFreeFigure) {
      let figPos: 'center' | 'left' | 'right' = 'center';
      if (pos === 'center') figPos = 'center';
      if (pos === 'left') figPos = 'left';
      if (pos === 'right') figPos = 'right';
      dispatch(stageActions.setFreeFigureByKey({ basePosition: figPos, key: id, name: content } satisfies IFreeFigure));
      setAnimationNames(id, sentence);
      setItemData();
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
      setItemData();
    }

    // 设置物品交互 - 使用轮询等待立绘加载完成
    const setupInteraction = () => {
      let attempts = 0;
      const maxAttempts = 50; // 最多尝试 50 次（5秒）
      const checkInterval = setInterval(() => {
        attempts++;
        // 使用正确的 key 查找立绘对象
        const stageObj = WebGAL.gameplay.pixiStage?.getStageObjByKey(id);
        if (stageObj && stageObj.pixiContainer) {
          // 找到 sprite（可能在 container 的 children 中）
          let sprite: any = null;
          for (const child of stageObj.pixiContainer.children) {
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
              // 添加物品到仓库
              const count = getNumberArgByKey(sentence, 'count') ?? 1;
              const resolvedCount = typeof count === 'string' ? Number(getValueFromStateElseKey(count, true)) : count;
              
              webgalStore.dispatch(addInventoryItem({
                itemId: itemIdStr,
                count: resolvedCount,
                name: itemDef.name,
              }));
              
              logger.debug(`选择物品: ${itemDef.name} (${itemIdStr}) x${resolvedCount}`);
              
              // 移除物品显示（使用 changeFigure 的方式）
              if (isFreeFigure) {
                dispatch(stageActions.setFreeFigureByKey({ basePosition: pos, key: id, name: '' } satisfies IFreeFigure));
              } else {
                if (pos === 'center') {
                  dispatch(setStage({ key: 'figName', value: '' }));
                } else if (pos === 'left') {
                  dispatch(setStage({ key: 'figNameLeft', value: '' }));
                } else if (pos === 'right') {
                  dispatch(setStage({ key: 'figNameRight', value: '' }));
                }
              }
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
          logger.warn(`无法为物品 ${itemIdStr} 设置交互：立绘加载超时`);
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
      WebGAL.gameplay.pixiStage?.stopPresetAnimationOnTarget(id);
    },
    blockingNext: () => false,
    blockingAuto: () => true,
    stopTimeout: undefined,
  };
}
