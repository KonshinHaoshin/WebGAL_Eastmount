import { ISentence, commandType } from '@/Core/controller/scene/sceneInterface';
import { initPerform, IPerform } from '@/Core/Modules/perform/performInterface';

import { WebGAL } from '@/Core/WebGAL';
import { scriptRegistry, SCRIPT_TAG_MAP, ScriptFunction } from '@/Core/parser/sceneParser';
import { logger } from '@/Core/util/logger';

/**
 * 语句调用器，真正执行语句的调用，并自动将演出在指定时间卸载
 * @param script 调用的语句
 */
export const runScript = (script: ISentence) => {
  let perform: IPerform = initPerform;
  const funcToRun: ScriptFunction = scriptRegistry[script.command]?.scriptFunction ?? SCRIPT_TAG_MAP.say.scriptFunction; // 默认是say

  // 调试信息
  if (script.command === commandType.loadAffectionFile) {
    console.log('loadAffectionFile 命令被解析，script:', script);
    console.log('scriptRegistry[script.command]:', scriptRegistry[script.command]);
  }

  // 调用脚本对应的函数
  perform = funcToRun(script);

  if (perform.arrangePerformPromise) {
    // 先立即添加初始 perform，确保游戏流程继续
    WebGAL.gameplay.performController.arrangeNewPerform(perform, script);
    // 等待 Promise 完成后再更新 perform
    perform.arrangePerformPromise
      .then((resolovedPerform) => {
        // 更新 perform（如果需要）
        WebGAL.gameplay.performController.arrangeNewPerform(resolovedPerform, script);
      })
      .catch((error) => {
        // 错误处理：确保游戏流程继续
        console.error('[runScript] arrangePerformPromise 失败:', error);
        logger.error('[runScript] arrangePerformPromise 失败', error);
      });
  } else {
    WebGAL.gameplay.performController.arrangeNewPerform(perform, script);
  }
};
