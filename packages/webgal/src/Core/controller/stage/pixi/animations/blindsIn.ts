import { WebGAL } from '@/Core/WebGAL';
import BlindsFilter from '@/Core/controller/stage/pixi/shaders/BlindsFilter';

export function generateBlindsInAnimationObj(targetKey: string, duration: number) {
  const target = WebGAL.gameplay.pixiStage?.getStageObjByKey(targetKey)?.pixiContainer;
  let filter: BlindsFilter | null = null;
  let elapsed = 0;
  const finish = () => {
    if (!target || !filter) return;
    filter.progress = 1;
    target.alpha = 1;
    target.filters = (target.filters ?? []).filter((item) => item !== filter);
    filter = null;
  };
  return {
    setStartState: () => {
      if (!target) return;
      filter = new BlindsFilter();
      target.filters = [...(target.filters ?? []), filter];
      target.alpha = 1;
      elapsed = 0;
    },
    setEndState: finish,
    tickerFunc: (delta: number) => {
      if (!filter) return;
      elapsed += delta * (WebGAL.gameplay.pixiStage?.currentApp?.ticker.deltaMS ?? 16.67);
      filter.progress = Math.min(1, elapsed / Math.max(duration, 1));
      if (filter.progress >= 1) finish();
    },
  };
}
