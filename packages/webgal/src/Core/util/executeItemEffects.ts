import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { WebGAL } from '@/Core/WebGAL';
import { WebgalParser, scriptRegistry, SCRIPT_TAG_MAP } from '@/Core/parser/sceneParser';
import { logger } from '@/Core/util/logger';
import { getValueFromStateElseKey } from '@/Core/gameScripts/setVar';
import { commandType } from '@/Core/controller/scene/sceneInterface';
import { getBooleanArgByKey } from '@/Core/util/getSentenceArg';
import { webgalStore } from '@/store/store';
import cloneDeep from 'lodash/cloneDeep';

/**
 * 插值函数：替换 {变量名} 为实际值
 */
function interpolationOneItem(content: string): string {
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
}

/**
 * 等待 perform 完成
 */
async function waitForPerform(perform: IPerform): Promise<void> {
  if (perform.duration <= 0) {
    return;
  }

  return new Promise<void>((resolve) => {
    const checkInterval = setInterval(() => {
      const performExists = WebGAL.gameplay.performController.performList.find(
        (p) => p.performName === perform.performName,
      );

      if (!performExists) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 50);

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, perform.duration + 100);
  });
}

/**
 * 保存 backlog（如果是 say 命令）
 */
function saveBacklogIfNeeded(
  interpolatedSentence: ISentence,
  capturedShowText: string | undefined,
  capturedShowName: string | undefined,
): void {
  if (interpolatedSentence.command !== commandType.say) {
    return;
  }

  const hasNotEnd = getBooleanArgByKey(interpolatedSentence, 'notend') ?? false;
  if (hasNotEnd || capturedShowText === undefined) {
    return;
  }

  const currentState = webgalStore.getState().stage;
  const stateToSave = cloneDeep(currentState);
  stateToSave.showText = capturedShowText;
  stateToSave.showName = capturedShowName || '';

  const backlogElement = {
    currentStageState: stateToSave,
    saveScene: {
      currentSentenceId: WebGAL.sceneManager.sceneData.currentSentenceId,
      sceneStack: cloneDeep(WebGAL.sceneManager.sceneData.sceneStack),
      sceneName: WebGAL.sceneManager.sceneData.currentScene.sceneName,
      sceneUrl: WebGAL.sceneManager.sceneData.currentScene.sceneUrl,
    },
  };
  WebGAL.backlogManager.insertBacklogItem(backlogElement);
}

/**
 * 执行单个语句
 */
async function executeSentence(sentence: ISentence): Promise<void> {
  // 进行变量插值
  const interpolatedSentence = cloneDeep(sentence);
  interpolatedSentence.content = interpolationOneItem(interpolatedSentence.content);
  interpolatedSentence.args.forEach((arg) => {
    if (arg.value && typeof arg.value === 'string') {
      arg.value = interpolationOneItem(arg.value);
    }
  });

  // 调用脚本函数获取 perform
  const funcToRun =
    scriptRegistry[interpolatedSentence.command]?.scriptFunction ?? SCRIPT_TAG_MAP.say.scriptFunction;
  const perform = funcToRun(interpolatedSentence);

  // 如果是 say 命令，捕获 showText 和 showName
  let capturedShowText: string | undefined;
  let capturedShowName: string | undefined;
  if (interpolatedSentence.command === commandType.say) {
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 10);
    });
    const currentState = webgalStore.getState().stage;
    capturedShowText = currentState.showText;
    capturedShowName = currentState.showName;
  }

  // 将 perform 添加到 performController
  let finalPerform: IPerform;
  if (perform.arrangePerformPromise) {
    finalPerform = await perform.arrangePerformPromise;
    WebGAL.gameplay.performController.arrangeNewPerform(finalPerform, interpolatedSentence);
  } else {
    finalPerform = perform;
    WebGAL.gameplay.performController.arrangeNewPerform(perform, interpolatedSentence);
  }

  // 等待 perform 完成
  await waitForPerform(finalPerform);

  // 保存 backlog（如果需要）
  saveBacklogIfNeeded(interpolatedSentence, capturedShowText, capturedShowName);
}

/**
 * 执行物品的 effects
 */
export async function executeItemEffects(itemId: string, effects: string[]): Promise<void> {
  for (let i = 0; i < effects.length; i++) {
    const effectString = effects[i];
    try {
      const parsedScene = WebgalParser.parse(effectString, `item-effect-${itemId}-${i}`, '');
      if (parsedScene.sentenceList.length > 0) {
        for (const sentence of parsedScene.sentenceList) {
          await executeSentence(sentence);
        }
      }
    } catch (error) {
      logger.error(`执行物品效果失败: ${effectString}`, error);
    }
  }
}

