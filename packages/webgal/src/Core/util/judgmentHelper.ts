import { commandType } from '@/Core/controller/scene/sceneInterface';
import { WebGAL } from '@/Core/WebGAL';

/**
 * 检查当前指令是否允许在审判模式下自动推进或手动跳过
 * @returns {boolean} 是否允许
 */
export const isCommandAllowedInJudgment = (): boolean => {
  const currentSentenceId = WebGAL.sceneManager.sceneData.currentSentenceId;
  const currentSentence = WebGAL.sceneManager.sceneData.currentScene.sentenceList[currentSentenceId];
  if (!currentSentence) return true;

  const allowedCommands = [
    commandType.changeBg,
    commandType.changeFigure,
    commandType.testimony,
    commandType.clearTestimony,
    commandType.judgment,
    commandType.label,
    commandType.jumpLabel,
    commandType.setVar,
    commandType.wait,
    commandType.manopedia,
    commandType.addItem,
    commandType.pediaUpdate,
    commandType.setTextbox,
  ];

  return allowedCommands.includes(currentSentence.command);
};
