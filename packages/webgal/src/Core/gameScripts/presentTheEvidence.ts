import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';
import { WebGAL } from '@/Core/WebGAL';

/**
 * 出示证据指令
 * 格式：presentTheEvidence:成功跳转场景|失败跳转场景 @目标道具ID;
 * @param sentence
 */
export function presentTheEvidence(sentence: ISentence): IPerform {
  const content = sentence.content;
  const parts = content.split(/(?<!\\)@/);

  const scenesPart = parts[0].trim();
  const targetId = parts.length > 1 ? parts[1].trim() : '';

  const scenes = scenesPart ? scenesPart.split('|').map((s) => s.trim()) : [];

  // 设置状态
  webgalStore.dispatch(setStage({ key: 'isEvidenceMode', value: true }));
  webgalStore.dispatch(setStage({ key: 'evidenceTarget', value: targetId }));
  webgalStore.dispatch(setStage({ key: 'evidenceJumpScenes', value: scenes }));

  // 打开图鉴
  webgalStore.dispatch(setStage({ key: 'enableManopedia', value: true }));

  return {
    performName: 'presentTheEvidence',
    duration: 1000 * 60 * 60 * 24, // 阻塞，直到手动卸载
    isHoldOn: false,
    stopFunction: () => {
      // 卸载时重置状态
      webgalStore.dispatch(setStage({ key: 'isEvidenceMode', value: false }));
      webgalStore.dispatch(setStage({ key: 'evidenceTarget', value: '' }));
      webgalStore.dispatch(setStage({ key: 'evidenceJumpScenes', value: [] }));
    },
    blockingNext: () => true,
    blockingAuto: () => true,
    stopTimeout: undefined,
  };
}
