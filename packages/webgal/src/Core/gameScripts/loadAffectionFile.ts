import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';
import { logger } from '@/Core/util/logger';
import axios from 'axios';
import type { IAffectionConfig } from 'webgal-parser';

/**
 * 加载好感度文件
 * 用法：loadAffectionFile:affection_test.json
 * @param sentence
 */
export const loadAffectionFileScript = (sentence: ISentence): IPerform => {
  // contentParser 已经处理过路径，可能包含 ./game/affection/ 前缀
  // 我们需要提取纯文件名
  let filename = sentence.content.trim();
  
  // 移除路径前缀，只保留文件名
  if (filename.includes('/')) {
    filename = filename.split('/').pop() || filename;
  }
  // 移除可能的 ./ 前缀
  filename = filename.replace(/^\.\//, '');
  
  logger.debug(`loadAffectionFile 命令被调用，原始 content: "${sentence.content}", 提取的文件名: "${filename}"`);
  console.log('[loadAffectionFile] 原始 content:', sentence.content, '提取的文件名:', filename);
  
  if (!filename) {
    logger.warn('loadAffectionFile 命令缺少文件名参数');
    return {
      performName: 'none',
      duration: 0,
      isHoldOn: false,
      stopFunction: () => {},
      blockingNext: () => false,
      blockingAuto: () => false,
      stopTimeout: undefined,
    };
  }

  logger.info(`加载好感度文件：${filename}`);
  console.log('[loadAffectionFile] 准备加载文件，filename:', filename);
  
  // 使用 arrangePerformPromise 等待文件加载完成
  return {
    performName: 'loadAffectionFile',
    duration: 0,
    isHoldOn: false,
    stopFunction: () => {},
    blockingNext: () => false, // 不阻塞，允许快进
    blockingAuto: () => false, // 不阻塞自动播放
    stopTimeout: undefined,
    arrangePerformPromise: new Promise<IPerform>((resolve) => {
      // 异步加载文件内容并存储到 stage
      (async () => {
        try {
          const url = `game/affection/${filename}`;
          logger.debug(`[loadAffectionFile] 开始加载文件内容: ${url}`);
          console.log(`[loadAffectionFile] 请求 URL: ${url}`);
          const resp = await axios.get(url);
          console.log(`[loadAffectionFile] 文件响应成功: ${filename}`, resp.status, resp.data);
          const jsonData = resp.data as IAffectionConfig;
          
          // 验证数据格式
          if (jsonData.character && jsonData.affectionLevels) {
            logger.debug(`[loadAffectionFile] 文件加载成功，存储到 stage: ${filename}`);
            console.log(`[loadAffectionFile] 文件加载成功，准备存储到 stage: ${filename}`);
            console.log(`[loadAffectionFile] 数据内容:`, {
              characterId: jsonData.character.id,
              characterName: jsonData.character.name,
              levelsCount: jsonData.affectionLevels.length,
            });
            
            // 获取当前 stage 中的 affectionData
            const currentAffectionData = webgalStore.getState().stage.affectionData || [];
            console.log(`[loadAffectionFile] 当前 stage 中的数据:`, currentAffectionData.map((d) => d.character.id));
            // 检查是否已存在（通过 character.id）
            const existingIndex = currentAffectionData.findIndex(
              (item) => item.character.id === jsonData.character.id,
            );
            
            let newAffectionData: IAffectionConfig[];
            if (existingIndex >= 0) {
              // 更新现有数据
              newAffectionData = [...currentAffectionData];
              newAffectionData[existingIndex] = jsonData;
              console.log(`[loadAffectionFile] 更新现有数据: ${jsonData.character.id}，索引: ${existingIndex}`);
            } else {
              // 添加新数据
              newAffectionData = [...currentAffectionData, jsonData];
              console.log(`[loadAffectionFile] 添加新数据: ${jsonData.character.id}`);
            }
            
            // 存储到 stage
            webgalStore.dispatch(setStage({ key: 'affectionData', value: newAffectionData }));
            const storedData = webgalStore.getState().stage.affectionData;
            console.log(`[loadAffectionFile] 存储后 stage 中的数据:`, storedData.map((d) => d.character.id));
            console.log(`[loadAffectionFile] 存储后 stage 中的数据详情:`, storedData.map((d) => ({
              id: d.character.id,
              name: d.character.name,
              varName: d.character.affectionVarName,
            })));
          } else {
            logger.warn(`[loadAffectionFile] 好感度配置文件格式不正确: ${filename}`, jsonData);
            console.warn(`[loadAffectionFile] 文件格式验证失败: ${filename}`, {
              hasCharacter: !!jsonData.character,
              hasAffectionLevels: !!jsonData.affectionLevels,
              data: jsonData,
            });
          }
        } catch (error: any) {
          logger.error(`[loadAffectionFile] 加载好感度配置文件失败: ${filename}`, error);
          console.error(`[loadAffectionFile] 加载文件失败: ${filename}`, error);
          if (error.response) {
            console.error(`[loadAffectionFile] 响应状态: ${error.response.status}`, error.response.data);
          } else if (error.request) {
            console.error(`[loadAffectionFile] 请求失败，无响应:`, error.request);
          } else {
            console.error(`[loadAffectionFile] 错误信息:`, error.message);
          }
        } finally {
          // 无论成功或失败，都 resolve Promise，返回一个不阻塞的 perform
          console.log(`[loadAffectionFile] 文件加载流程完成: ${filename}`);
          resolve({
            performName: 'loadAffectionFile',
            duration: 0,
            isHoldOn: false,
            stopFunction: () => {},
            blockingNext: () => false,
            blockingAuto: () => false,
            stopTimeout: undefined,
          });
        }
      })();
    }),
  };
};

