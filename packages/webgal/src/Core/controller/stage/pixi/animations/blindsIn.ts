import { WebGAL } from '@/Core/WebGAL';
import BlindsFilter from '@/Core/controller/stage/pixi/shaders/BlindsFilter';

/**
 * 百叶窗进场动画
 * @param targetKey 目标 Key
 * @param duration 动画持续时间（总时间，包括前置黑屏时间）
 */
export function generateBlindsInAnimationObj(targetKey: string, duration: number) {
  const target = WebGAL.gameplay.pixiStage!.getStageObjByKey(targetKey);
  let filter: BlindsFilter | null = null;
  let elapsed = 0;
  let finished = false; // ⭐ 完成锁

  function setStartState() {
    if (target) {
      // 在开始新动画前，如果已经存在 filter（说明上一个动画可能没正常结束），先清理
      if (filter) {
        target.pixiContainer.filters = (target.pixiContainer.filters || []).filter((f) => f !== filter);
      }
      filter = new BlindsFilter(0, 16);
      target.pixiContainer.filters = [...(target.pixiContainer.filters || []), filter];
      target.pixiContainer.alpha = 0;
      finished = false;
      elapsed = 0;
    }
  }

  function setEndState() {
    finishAnimation();
  }

  function finishAnimation() {
    if (!target || !filter || finished) return;

    filter.progress = 1;
    target.pixiContainer.alpha = 1;
    target.pixiContainer.filters = (target.pixiContainer.filters || []).filter((f) => f !== filter);

    finished = true;
  }

  function tickerFunc(delta: number) {
    if (!target || !filter || finished) return;

    const baseDuration = WebGAL.gameplay.pixiStage!.frameDuration;
    const ms = delta * baseDuration;
    elapsed += ms;

    target.pixiContainer.alpha = 1;

    const currentAddProgressDelta = (duration / baseDuration) * delta;
    const increment = 1 / currentAddProgressDelta;

    filter.progress += increment;

    if (filter.progress >= 1) {
      finishAnimation();
    }
  }

  return {
    setStartState,
    setEndState,
    tickerFunc,
  };
}
