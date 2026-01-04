import { generateUniversalSoftInAnimationObj } from '@/Core/controller/stage/pixi/animations/universalSoftIn';
import { generateUniversalSoftOffAnimationObj } from '@/Core/controller/stage/pixi/animations/universalSoftOff';
import { generateTestblurAnimationObj } from '@/Core/controller/stage/pixi/animations/testblur';
import { generateBlindsInAnimationObj } from '@/Core/controller/stage/pixi/animations/blindsIn';

export const webgalAnimations: Array<{ name: string; animationGenerateFunc: Function }> = [
  { name: 'universalSoftIn', animationGenerateFunc: generateUniversalSoftInAnimationObj },
  { name: 'universalSoftOff', animationGenerateFunc: generateUniversalSoftOffAnimationObj },
  { name: 'testblur', animationGenerateFunc: generateTestblurAnimationObj },
  { name: 'blindsIn', animationGenerateFunc: generateBlindsInAnimationObj },
];
