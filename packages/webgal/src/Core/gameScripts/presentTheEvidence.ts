import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';

/**
 * 出示证据指令
 * 格式：presentTheEvidence:成功跳转场景|失败跳转场景 @目标道具ID;
 * @param sentence
 */
export function presentTheEvidence(sentence: ISentence): IPerform {
  // 注意：sentence.content 应该已经被 contentParser 处理过
  // 但为了鲁棒性，如果文件名没有转为完整路径（比如没有 ./game/scene/），我们在这里补全
  const content = sentence.content;
  const parts = content.split(/(?<!\\)@/);

  const scenesPart = (parts[0] || '').trim();
  const targetId = parts.length > 1 ? parts[1].trim() : '';

  const scenes = scenesPart ? scenesPart.split('|').map((s) => {
    const trimmed = s.trim();
    // 如果不包含路径前缀且包含 .txt，说明可能没有被 parser 处理，手动补全
    if (trimmed && !trimmed.startsWith('./') && !trimmed.startsWith('http') && trimmed.endsWith('.txt')) {
      return assetSetter(trimmed, fileType.scene);
    }
    return trimmed;
  }) : [];

  // 设置状态
  webgalStore.dispatch(setStage({ key: 'isEvidenceMode', value: true }));
  webgalStore.dispatch(setStage({ key: 'evidenceTarget', value: targetId }));
  webgalStore.dispatch(setStage({ key: 'evidenceJumpScenes', value: scenes }));

  // 直接显示图鉴界面
  webgalStore.dispatch(setStage({ key: 'showManopedia', value: true }));

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
