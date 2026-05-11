// spineHandlers.ts
import { WebGALPixiContainer } from '@/Core/controller/stage/pixi/WebGALPixiContainer';
import { v4 as uuid } from 'uuid';
import * as PIXI from 'pixi.js';
import PixiStage from '@/Core/controller/stage/pixi/PixiController';
import { logger } from '@/Core/util/logger';
import { webgalStore } from '@/store/store';
// @ts-ignore
let pixiSpineModule: typeof import('pixi-spine') | null = null;
// @ts-ignore
let pixiSpineLoading: Promise<typeof import('pixi-spine') | null> | null = null;

let spineLoader: undefined | PIXI.Loader;

// @ts-ignore
export async function loadPixiSpine(): Promise<typeof import('pixi-spine') | null> {
  if (pixiSpineModule) {
    return pixiSpineModule;
  }

  if (pixiSpineLoading) {
    return pixiSpineLoading;
  }

  // @ts-ignore
  pixiSpineLoading = import('pixi-spine')
    .then((module) => {
      spineLoader = new PIXI.Loader();
      pixiSpineModule = module;
      return module;
    })
    .catch((error) => {
      console.error('Failed to load pixi-spine. Spine features will be disabled.', error);
      return null;
    })
    .finally(() => {
      pixiSpineLoading = null;
    });

  return pixiSpineLoading;
}

/**
 * 添加 Spine 立绘的实现函数
 */
// eslint-disable-next-line max-params
export async function addSpineFigureImpl(
  this: PixiStage,
  key: string,
  url: string,
  presetPosition: 'left' | 'center' | 'right' = 'center',
) {
  const spineId = `spine-${url}`;
  const thisFigureContainer = new WebGALPixiContainer();

  const setFigIndex = this.figureObjects.findIndex((e) => e.key === key);
  if (setFigIndex >= 0) {
    this.removeStageObjectByKey(key);
  }

  this.applyFigureMetadata(thisFigureContainer, key);
  this.figureContainer.addChild(thisFigureContainer);
  const figureUuid = uuid();
  this.figureObjects.push({
    uuid: figureUuid,
    key: key,
    pixiContainer: thisFigureContainer,
    sourceUrl: url,
    sourceType: 'spine',
    sourceExt: this.getExtName(url),
    spineAnimation: '_initial',
  });
  const pixiSpine = await loadPixiSpine();

  const setup = async () => {
    setTimeout(() => {
      console.log('Setting up Spine' + key + url);
      if (!pixiSpine) {
        logger.warn(`Spine module not loaded. Skipping Spine figure: ${key}`);
        return;
      }

      const { Spine } = pixiSpine;
      const spineResource: any = spineLoader!.resources?.[spineId];
      if (spineResource && this.getStageObjByUuid(figureUuid)) {
        const figureSpine = new Spine(spineResource.spineData);
        const spineBounds = figureSpine.getLocalBounds();
        const spineCenterX = spineBounds.x + spineBounds.width / 2;
        const spineCenterY = spineBounds.y + spineBounds.height / 2;
        figureSpine.pivot.set(spineCenterX, spineCenterY);
        figureSpine.interactive = false;

        const motionFromState = webgalStore.getState().stage.live2dMotion.find((e) => e.target === key);
        let animationToPlay = '';

        if (
          motionFromState &&
          figureSpine.spineData.animations.find((anim: any) => anim.name === motionFromState.motion)
        ) {
          animationToPlay = motionFromState.motion;
        } else if (figureSpine.spineData.animations.length > 0) {
          animationToPlay = figureSpine.spineData.animations[0].name;
        }

        if (animationToPlay) {
          figureSpine.state.setAnimation(0, animationToPlay, false);
          figureSpine.autoUpdate = true;
          const stageObj = this.getStageObjByUuid(figureUuid);
          if (stageObj) {
            if (stageObj.spineAnimation) {
              stageObj.spineAnimation = animationToPlay;
            }
          }
        }

        const figureSprite = new PIXI.Sprite();
        figureSprite.addChild(figureSpine);
        this.setContainerInitialPosition({
          container: thisFigureContainer,
          childContainer: figureSprite,
          originalWidth: figureSpine.width,
          originalHeight: figureSpine.height,
          position: presetPosition,
          isLive2DFigure: false,
        });
      }
    }, 0);
  };

  this.cacheGC();
  if (!spineLoader!.resources?.[spineId]) {
    spineLoader!.add(spineId, url).load(setup);
  } else {
    await setup();
  }
}

/**
 * 添加 Spine 背景的实现函数
 */
export async function addSpineBgImpl(this: PixiStage, key: string, url: string) {
  const spineId = `spine-${url}`;
  const thisBgContainer = new WebGALPixiContainer();

  const setBgIndex = this.backgroundObjects.findIndex((e) => e.key === key);
  if (setBgIndex >= 0) {
    this.removeStageObjectByKey(key);
  }

  this.backgroundContainer.addChild(thisBgContainer);
  const bgUuid = uuid();
  this.backgroundObjects.push({
    uuid: bgUuid,
    key: key,
    pixiContainer: thisBgContainer,
    sourceUrl: url,
    sourceType: 'spine',
    sourceExt: this.getExtName(url),
  });

  const setup = async () => {
    const pixiSpine = await loadPixiSpine();
    if (!pixiSpine) {
      logger.warn(`Spine module not loaded. Skipping Spine background: ${key}`);
      return;
    }

    const { Spine } = pixiSpine;
    const spineResource: any = spineLoader!.resources?.[spineId];
    setTimeout(() => {
      if (spineResource && this.getStageObjByUuid(bgUuid)) {
        const bgSpine = new Spine(spineResource.spineData);
        logger.debug('bgSpine state', bgSpine.state);
        if (bgSpine.spineData.animations.length > 0) {
          bgSpine.state.setAnimation(0, bgSpine.spineData.animations[0].name, true);
        }
        const bgSprite = new PIXI.Sprite();
        bgSprite.addChild(bgSpine);
        this.setContainerInitialPosition({
          container: thisBgContainer,
          childContainer: bgSprite,
          originalWidth: bgSpine.width,
          originalHeight: bgSpine.height,
          position: 'bg',
          isLive2DFigure: false,
        });
      }
    }, 0);
  };

  this.cacheGC();
  if (!spineLoader!.resources?.[spineId]) {
    spineLoader!.add(spineId, url).load(setup);
  } else {
    await setup();
  }
}
