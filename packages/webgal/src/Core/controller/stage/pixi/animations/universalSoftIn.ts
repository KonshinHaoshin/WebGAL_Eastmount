import { WebGAL } from '@/Core/WebGAL';

export function generateUniversalSoftInAnimationObj(targetKey: string, duration: number) {
  const target = WebGAL.gameplay.pixiStage!.getStageObjByKey(targetKey);

  let elapsedTime = 0;
  let startAlpha = 0;

  /**
   * 在此书写为动画设置初始的操作
   */
  function setStartState() {
    elapsedTime = 0;
    if (target?.pixiContainer) {
      startAlpha = target.pixiContainer.alpha;
    }
  }

  /**
   * 在此书写为动画设置终态的操作
   */
  function setEndState() {
    if (target?.pixiContainer) {
      target.pixiContainer.alpha = 1;
    }
  }

  /**
   * 在此书写动画每一帧执行的函数
   * @param delta
   */
  function tickerFunc(delta: number) {
    if (target) {
      const sprite = target.pixiContainer;
      const baseDuration = WebGAL.gameplay.pixiStage!.frameDuration;

      elapsedTime += baseDuration;
      const realElapsedTime = Math.min(elapsedTime, duration);
      const progress = realElapsedTime / duration;
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      if (sprite) sprite.alpha = startAlpha + (1 - startAlpha) * easedProgress;
    }
  }

  return {
    setStartState,
    setEndState,
    tickerFunc,
  };
}
