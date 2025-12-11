import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { loadAffectionFile } from '@/store/userDataReducer';
import { logger } from '@/Core/util/logger';

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
  console.log('[loadAffectionFile] 准备 dispatch，filename:', filename);
  
  webgalStore.dispatch(loadAffectionFile(filename));
  
  // 等待 dispatch 完成后再读取
  setTimeout(() => {
    const currentFiles = webgalStore.getState().userData.affectionFiles;
    logger.debug(`当前已加载的好感度文件列表：`, currentFiles);
    console.log('[loadAffectionFile] 执行完成，当前文件列表：', currentFiles);
  }, 0);

  return {
    performName: 'none',
    duration: 0,
    isHoldOn: false,
    stopFunction: () => {},
    blockingNext: () => false,
    blockingAuto: () => false,
    stopTimeout: undefined,
  };
};

