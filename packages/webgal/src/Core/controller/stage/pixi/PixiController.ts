import * as PIXI from 'pixi.js';
import { v4 as uuid } from 'uuid';
import { webgalStore } from '@/store/store';
import { setStage, stageActions } from '@/store/stageReducer';
import cloneDeep from 'lodash/cloneDeep';
import {
  IEffect,
  IFigureAssociatedAnimation,
  IFigureMetadata,
  IFreeFigure,
  ITransform,
  baseTransform,
} from '@/store/stageInterface';
import { logger } from '@/Core/util/logger';
import { isIOS } from '@/Core/initializeScript';
import { WebGALPixiContainer } from '@/Core/controller/stage/pixi/WebGALPixiContainer';
import { Live2D, WebGAL } from '@/Core/WebGAL';
import { CharacterPlayer } from 'webgal_mano';
import { SCREEN_CONSTANTS } from '@/Core/util/constants';
import { addSpineBgImpl, addSpineFigureImpl } from '@/Core/controller/stage/pixi/spine';
import { AnimatedGIF } from '@pixi/gif';
import { setFreeFigure } from '@/store/stageReducer';
import { baseBlinkParam, baseFocusParam, BlinkParam, FocusParam } from '@/Core/live2DCore';
import { isEqual } from 'lodash';
// import { figureCash } from '@/Core/gameScripts/vocal/conentsCash'; // 如果要使用 Live2D，取消这里的注释
// import { Live2DModel, SoundManager } from 'pixi-live2d-display-webgal'; // 如果要使用 Live2D，取消这里的注释

export interface IAnimationObject {
  setStartState: Function;
  setEndState: Function;
  tickerFunc: PIXI.TickerCallback<number>;
  getEndStateEffect?: Function;
}

interface IStageAnimationObject {
  // 唯一标识
  uuid: string;
  // 一般与作用目标有关
  key: string;
  targetKey?: string;
  type: 'common' | 'preset';
  animationObject: IAnimationObject;
}

export interface IStageObject {
  // 唯一标识
  uuid: string;
  // 一般与作用目标有关
  key: string;
  pixiContainer: WebGALPixiContainer;
  // 相关的源 url
  sourceUrl: string;
  sourceExt: string;
  sourceType: 'img' | 'live2d' | 'spine' | 'gif' | 'video' | 'stage' | 'webgal_mano';
  spineAnimation?: string;
  isExiting?: boolean;
}

export interface ILive2DRecord {
  target: string;
  motion: string;
  expression: string;
  blink: BlinkParam;
  focus: FocusParam;
}

// export interface IRegisterTickerOpr {
//   tickerGeneratorFn: (targetKey: string, duration: number) => PIXI.TickerCallback<number>;
//   key: string;
//   target: string;
//   duration: number;
// }

// @ts-ignore
window.PIXI = PIXI;

export default class PixiStage {
  public static assignTransform<T extends ITransform>(target: T, source?: ITransform) {
    if (!source) return;
    const targetScale = target.scale;
    const targetPosition = target.position;
    if (target.scale) Object.assign(targetScale, source.scale);
    if (target.position) Object.assign(targetPosition, source.position);
    Object.assign(target, source);
    target.scale = targetScale;
    target.position = targetPosition;
  }

  /**
   * 当前的 PIXI App
   */
  public currentApp: PIXI.Application | null = null;
  public readonly mainStageContainer: WebGALPixiContainer;
  public readonly foregroundEffectsContainer: PIXI.Container;
  public readonly backgroundEffectsContainer: PIXI.Container;
  public frameDuration = 16.67;
  public notUpdateBacklogEffects = false;
  public readonly figureContainer: PIXI.Container;
  public figureObjects: Array<IStageObject> = [];
  public stageWidth = SCREEN_CONSTANTS.width;
  public stageHeight = SCREEN_CONSTANTS.height;
  public assetLoader = new PIXI.Loader();
  public readonly backgroundContainer: PIXI.Container;
  public backgroundObjects: Array<IStageObject> = [];
  public mainStageObject: IStageObject;
  // Item 容器相关
  public itemApp: PIXI.Application | null = null;
  public readonly itemContainer: PIXI.Container;
  public itemObjects: Array<IStageObject> = [];
  /**
   * 添加 Spine 立绘
   * @param key 立绘的标识，一般和立绘位置有关
   * @param url 立绘图片url
   * @param presetPosition
   */
  public addSpineFigure = addSpineFigureImpl.bind(this);
  public addSpineBg = addSpineBgImpl.bind(this);
  // 注册到 Ticker 上的函数
  private stageAnimations: Array<IStageAnimationObject> = [];
  private loadQueue: { url: string; callback: () => void; name?: string }[] = [];
  private live2dFigureRecorder: Array<ILive2DRecord> = [];
  // 锁定变换对象（对象可能正在执行动画，不能应用变换）
  private lockTransformTarget: Array<string> = [];

  /**
   * 暂时没用上，以后可能用
   * @private
   */
  private MAX_TEX_COUNT = 10;

  private figureCash: any;
  private live2DModel: any;
  private soundManager: any;

  private loadedJsonlCache: Set<string> = new Set();

  public constructor() {
    const app = new PIXI.Application({
      backgroundAlpha: 0,
      preserveDrawingBuffer: true,
    });
    // @ts-ignore

    window.PIXIapp = this; // @ts-ignore
    window.__PIXI_APP__ = app;
    // 清空原节点
    const pixiContainer = document.getElementById('pixiContianer');
    if (pixiContainer) {
      pixiContainer.innerHTML = '';
      pixiContainer.appendChild(app.view);
    }

    // 设置样式
    app.renderer.view.style.position = 'absolute';
    app.renderer.view.style.display = 'block';
    app.renderer.view.id = 'pixiCanvas';
    // @ts-ignore
    app.renderer.autoResize = true;
    const appRoot = document.getElementById('root');
    if (appRoot) {
      app.renderer.resize(appRoot.clientWidth, appRoot.clientHeight);
    }
    if (isIOS) {
      app.renderer.view.style.zIndex = '-5';
    }

    // 添加主舞台容器
    this.mainStageContainer = new WebGALPixiContainer();
    // 设置可排序
    this.mainStageContainer.sortableChildren = true;
    this.mainStageContainer.setBaseX(this.stageWidth / 2);
    this.mainStageContainer.setBaseY(this.stageHeight / 2);
    this.mainStageContainer.pivot.set(this.stageWidth / 2, this.stageHeight / 2);
    app.stage.addChild(this.mainStageContainer);

    this.mainStageObject = {
      uuid: uuid(),
      key: 'stage-main',
      pixiContainer: this.mainStageContainer,
      sourceUrl: '',
      sourceType: 'stage',
      sourceExt: '',
    };

    // 添加 4 个 Container 用于做渲染
    this.foregroundEffectsContainer = new PIXI.Container(); // 前景特效
    this.foregroundEffectsContainer.zIndex = 3;
    this.figureContainer = new PIXI.Container();
    this.figureContainer.sortableChildren = true; // 允许立绘启用 z-index
    this.figureContainer.zIndex = 2;
    this.backgroundEffectsContainer = new PIXI.Container(); // 背景特效
    this.backgroundEffectsContainer.zIndex = 1;
    this.backgroundContainer = new PIXI.Container();
    this.backgroundContainer.zIndex = 0;
    this.mainStageContainer.addChild(
      this.foregroundEffectsContainer,
      this.figureContainer,
      this.backgroundEffectsContainer,
      this.backgroundContainer,
    );
    this.currentApp = app;

    // 创建独立的 Item PIXI Application
    const itemApp = new PIXI.Application({
      backgroundAlpha: 0,
      preserveDrawingBuffer: true,
      autoStart: true,
    });
    // 启用交互
    itemApp.stage.interactive = true;
    itemApp.stage.hitArea = new PIXI.Rectangle(0, 0, this.stageWidth, this.stageHeight);
    const itemContainerElement = document.getElementById('itemContainer');
    if (itemContainerElement) {
      itemContainerElement.innerHTML = '';
      itemContainerElement.appendChild(itemApp.view);
    }

    // 设置样式
    itemApp.renderer.view.style.position = 'absolute';
    itemApp.renderer.view.style.display = 'block';
    itemApp.renderer.view.id = 'itemCanvas';
    // @ts-ignore
    itemApp.renderer.autoResize = true;
    if (appRoot) {
      itemApp.renderer.resize(appRoot.clientWidth, appRoot.clientHeight);
    }

    // 创建 Item 容器
    this.itemContainer = new PIXI.Container();
    this.itemContainer.sortableChildren = true;
    itemApp.stage.addChild(this.itemContainer);
    this.itemApp = itemApp;
    // 每 5s 获取帧率，并且防 loader 死
    const update = () => {
      this.updateFps();
      setTimeout(update, 10000);
    };
    update();
    // loader 防死
    const reload = () => {
      setTimeout(reload, 500);
      this.callLoader();
    };
    reload();
    this.initialize().then(() => {});
  }

  public getFigureObjects() {
    return this.figureObjects;
  }

  public getAllLockedObject() {
    return this.lockTransformTarget;
  }

  /**
   * 注册动画
   * @param animationObject
   * @param key
   * @param target
   */
  public registerAnimation(animationObject: IAnimationObject | null, key: string, target = 'default') {
    if (!animationObject) return;
    this.stageAnimations.push({ uuid: uuid(), animationObject, key: key, targetKey: target, type: 'common' });
    // 上锁
    this.lockStageObject(target);
    animationObject.setStartState();
    this.currentApp?.ticker.add(animationObject.tickerFunc);
  }

  /**
   * 注册预设动画
   * @param animationObject
   * @param key
   * @param target
   * @param currentEffects
   */
  // eslint-disable-next-line max-params
  public registerPresetAnimation(
    animationObject: IAnimationObject | null,
    key: string,
    target = 'default',
    currentEffects: IEffect[],
  ) {
    if (!animationObject) return;
    const effect = currentEffects.find((effect) => effect.target === target);
    if (effect) {
      const targetPixiContainer = this.getStageObjByKey(target);
      if (targetPixiContainer) {
        const container = targetPixiContainer.pixiContainer;
        PixiStage.assignTransform(container, effect.transform);
      }
      return;
    }
    this.stageAnimations.push({ uuid: uuid(), animationObject, key: key, targetKey: target, type: 'preset' });
    // 上锁
    this.lockStageObject(target);
    animationObject.setStartState();
    this.currentApp?.ticker.add(animationObject.tickerFunc);
  }

  public stopPresetAnimationOnTarget(target: string) {
    const targetPresetAnimations = this.stageAnimations.find((e) => e.targetKey === target && e.type === 'preset');
    if (targetPresetAnimations) {
      this.removeAnimation(targetPresetAnimations.key);
    }
  }

  /**
   * 移除动画
   * @param key
   */
  public removeAnimationByIndex(index: number) {
    if (index >= 0) {
      const thisTickerFunc = this.stageAnimations[index];
      this.currentApp?.ticker.remove(thisTickerFunc.animationObject.tickerFunc);
      thisTickerFunc.animationObject.setEndState();
      this.unlockStageObject(thisTickerFunc.targetKey ?? 'default');
      this.stageAnimations.splice(index, 1);
    }
  }

  public removeAllAnimations() {
    while (this.stageAnimations.length > 0) {
      this.removeAnimationByIndex(0);
    }
  }

  public removeAnimation(key: string) {
    const index = this.stageAnimations.findIndex((e) => e.key === key);
    this.removeAnimationByIndex(index);
  }

  public removeAnimationWithSetEffects(key: string) {
    const index = this.stageAnimations.findIndex((e) => e.key === key);
    if (index >= 0) {
      const thisTickerFunc = this.stageAnimations[index];
      this.currentApp?.ticker.remove(thisTickerFunc.animationObject.tickerFunc);
      thisTickerFunc.animationObject.setEndState();
      const endStateEffect = thisTickerFunc.animationObject.getEndStateEffect?.() ?? {};
      this.unlockStageObject(thisTickerFunc.targetKey ?? 'default');
      if (thisTickerFunc.targetKey) {
        const target = this.getStageObjByKey(thisTickerFunc.targetKey);
        if (target) {
          let effect: IEffect = {
            target: thisTickerFunc.targetKey,
            transform: endStateEffect,
          };
          webgalStore.dispatch(stageActions.updateEffect(effect));
          // if (!this.notUpdateBacklogEffects) updateCurrentBacklogEffects(webgalStore.getState().stage.effects);
        }
      }
      this.stageAnimations.splice(index, 1);
    }
  }

  // eslint-disable-next-line max-params
  public performMouthSyncAnimation(
    key: string,
    targetAnimation: IFigureAssociatedAnimation,
    mouthState: string,
    presetPosition: string,
  ) {
    const currentFigure = this.getStageObjByKey(key)?.pixiContainer as WebGALPixiContainer;

    if (!currentFigure) {
      return;
    }

    const mouthTextureUrls: any = {
      open: targetAnimation.mouthAnimation.open,
      half_open: targetAnimation.mouthAnimation.halfOpen,
      closed: targetAnimation.mouthAnimation.close,
    };

    // Load mouth texture (reuse if already loaded)
    this.loadAsset(mouthTextureUrls[mouthState], () => {
      const texture = this.assetLoader.resources[mouthTextureUrls[mouthState]].texture;
      const sprite = currentFigure?.children?.[0] as PIXI.Sprite;
      if (!texture || !sprite) {
        return;
      }
      sprite.texture = texture;
    });
  }

  // eslint-disable-next-line max-params
  public performBlinkAnimation(
    key: string,
    targetAnimation: IFigureAssociatedAnimation,
    blinkState: string,
    presetPosition: string,
  ) {
    const currentFigure = this.getStageObjByKey(key)?.pixiContainer as WebGALPixiContainer;

    if (!currentFigure) {
      return;
    }
    const blinkTextureUrls: any = {
      open: targetAnimation.blinkAnimation.open,
      closed: targetAnimation.blinkAnimation.close,
    };

    // Load eye texture (reuse if already loaded)
    this.loadAsset(blinkTextureUrls[blinkState], () => {
      const texture = this.assetLoader.resources[blinkTextureUrls[blinkState]].texture;
      const sprite = currentFigure?.children?.[0] as PIXI.Sprite;
      if (!texture || !sprite) {
        return;
      }
      sprite.texture = texture;
    });
  }

  /**
   * 添加背景
   * @param key 背景的标识，一般和背景类型有关
   * @param url 背景图片url
   */
  public addBg(key: string, url: string) {
    // const loader = this.assetLoader;
    const loader = this.assetLoader;
    // 准备用于存放这个背景的 Container
    const thisBgContainer = new WebGALPixiContainer();

    // 是否有相同 key 的背景
    const setBgIndex = this.backgroundObjects.findIndex((e) => e.key === key);
    const isBgSet = setBgIndex >= 0;

    // 已经有一个这个 key 的背景存在了
    if (isBgSet) {
      // 挤占
      this.removeStageObjectByKey(key);
    }

    // 挂载
    this.backgroundContainer.addChild(thisBgContainer);
    const bgUuid = uuid();
    this.backgroundObjects.push({
      uuid: bgUuid,
      key: key,
      pixiContainer: thisBgContainer,
      sourceUrl: url,
      sourceType: 'img',
      sourceExt: this.getExtName(url),
    });

    // 完成图片加载后执行的函数
    const setup = () => {
      // TODO：找一个更好的解法，现在的解法是无论是否复用原来的资源，都设置一个延时以让动画工作正常！

      setTimeout(() => {
        const texture = loader.resources?.[url]?.texture;
        if (texture && this.getStageObjByUuid(bgUuid)) {
          /**
           * 重设大小
           */
          const originalWidth = texture.width;
          const originalHeight = texture.height;
          const scaleX = this.stageWidth / originalWidth;
          const scaleY = this.stageHeight / originalHeight;
          const targetScale = Math.max(scaleX, scaleY);
          const bgSprite = new PIXI.Sprite(texture);
          bgSprite.scale.x = targetScale;
          bgSprite.scale.y = targetScale;
          bgSprite.anchor.set(0.5);
          bgSprite.position.y = this.stageHeight / 2;
          thisBgContainer.setBaseX(this.stageWidth / 2);
          thisBgContainer.setBaseY(this.stageHeight / 2);
          thisBgContainer.pivot.set(0, this.stageHeight / 2);

          // 挂载
          thisBgContainer.addChild(bgSprite);
        }
      }, 0);
    };

    /**
     * 加载器部分
     */
    this.cacheGC();
    if (!loader.resources?.[url]?.texture) {
      this.loadAsset(url, setup);
    } else {
      // 复用
      setup();
    }
  }

  /**
   * 添加视频背景
   * @param key 背景的标识，一般和背景类型有关
   * @param url 背景图片url
   */
  public addVideoBg(key: string, url: string) {
    const loader = this.assetLoader;
    // 准备用于存放这个背景的 Container
    const thisBgContainer = new WebGALPixiContainer();

    // 是否有相同 key 的背景
    const setBgIndex = this.backgroundObjects.findIndex((e) => e.key === key);
    const isBgSet = setBgIndex >= 0;

    // 已经有一个这个 key 的背景存在了
    if (isBgSet) {
      // 挤占
      this.removeStageObjectByKey(key);
    }

    // 挂载
    this.backgroundContainer.addChild(thisBgContainer);
    const bgUuid = uuid();
    this.backgroundObjects.push({
      uuid: bgUuid,
      key: key,
      pixiContainer: thisBgContainer,
      sourceUrl: url,
      sourceType: 'video',
      sourceExt: this.getExtName(url),
    });

    // 完成加载后执行的函数
    const setup = () => {
      // TODO：找一个更好的解法，现在的解法是无论是否复用原来的资源，都设置一个延时以让动画工作正常！

      setTimeout(() => {
        console.debug('start loaded video: ' + url);
        const video = document.createElement('video');
        const videoResource = new PIXI.VideoResource(video);
        videoResource.src = url;
        videoResource.source.preload = 'auto';
        videoResource.source.muted = true;
        videoResource.source.loop = true;
        videoResource.source.autoplay = true;
        videoResource.source.src = url;
        // @ts-ignore
        const texture = PIXI.Texture.from(videoResource);
        if (texture && this.getStageObjByUuid(bgUuid)) {
          /**
           * 重设大小
           */
          texture.baseTexture.resource.load().then(() => {
            const originalWidth = videoResource.source.videoWidth;
            const originalHeight = videoResource.source.videoHeight;
            const scaleX = this.stageWidth / originalWidth;
            const scaleY = this.stageHeight / originalHeight;
            const targetScale = Math.max(scaleX, scaleY);
            const bgSprite = new PIXI.Sprite(texture);
            bgSprite.scale.x = targetScale;
            bgSprite.scale.y = targetScale;
            bgSprite.anchor.set(0.5);
            bgSprite.position.y = this.stageHeight / 2;
            thisBgContainer.setBaseX(this.stageWidth / 2);
            thisBgContainer.setBaseY(this.stageHeight / 2);
            thisBgContainer.pivot.set(0, this.stageHeight / 2);
            thisBgContainer.addChild(bgSprite);
          });
        }
      }, 0);
    };

    /**
     * 加载器部分
     */
    this.cacheGC();
    if (!loader.resources?.[url]?.texture) {
      this.loadAsset(url, setup);
    } else {
      // 复用
      setup();
    }
  }

  /**
   * 添加立绘
   * @param key 立绘的标识，一般和立绘位置有关
   * @param url 立绘图片url
   * @param presetPosition
   */
  public addFigure(key: string, url: string, presetPosition: 'left' | 'center' | 'right' = 'center') {
    const loader = this.assetLoader;
    // 准备用于存放这个立绘的 Container
    const thisFigureContainer = new WebGALPixiContainer();

    // 是否有相同 key 的立绘
    const setFigIndex = this.figureObjects.findIndex((e) => e.key === key);
    const isFigSet = setFigIndex >= 0;

    // 已经有一个这个 key 的立绘存在了
    if (isFigSet) {
      this.removeStageObjectByKey(key);
    }

    const metadata = this.getFigureMetadataByKey(key);
    if (metadata) {
      if (metadata.zIndex) {
        thisFigureContainer.zIndex = metadata.zIndex;
      }
    }
    // 挂载
    this.figureContainer.addChild(thisFigureContainer);
    const figureUuid = uuid();
    this.figureObjects.push({
      uuid: figureUuid,
      key: key,
      pixiContainer: thisFigureContainer,
      sourceUrl: url,
      sourceType: 'img',
      sourceExt: this.getExtName(url),
    });

    // 完成图片加载后执行的函数
    const setup = () => {
      // TODO：找一个更好的解法，现在的解法是无论是否复用原来的资源，都设置一个延时以让动画工作正常！
      setTimeout(() => {
        const texture = loader.resources?.[url]?.texture;
        if (texture && this.getStageObjByUuid(figureUuid)) {
          /**
           * 重设大小
           */
          const originalWidth = texture.width;
          const originalHeight = texture.height;
          const scaleX = this.stageWidth / originalWidth;
          const scaleY = this.stageHeight / originalHeight;
          const targetScale = Math.min(scaleX, scaleY);
          const figureSprite = new PIXI.Sprite(texture);
          figureSprite.scale.x = targetScale;
          figureSprite.scale.y = targetScale;
          figureSprite.anchor.set(0.5);
          figureSprite.position.y = this.stageHeight / 2;
          const targetWidth = originalWidth * targetScale;
          const targetHeight = originalHeight * targetScale;
          thisFigureContainer.setBaseY(this.stageHeight / 2);
          if (targetHeight < this.stageHeight) {
            thisFigureContainer.setBaseY(this.stageHeight / 2 + (this.stageHeight - targetHeight) / 2);
          }
          if (presetPosition === 'center') {
            thisFigureContainer.setBaseX(this.stageWidth / 2);
          }
          if (presetPosition === 'left') {
            thisFigureContainer.setBaseX(targetWidth / 2);
          }
          if (presetPosition === 'right') {
            thisFigureContainer.setBaseX(this.stageWidth - targetWidth / 2);
          }
          thisFigureContainer.pivot.set(0, this.stageHeight / 2);
          thisFigureContainer.addChild(figureSprite);
        }
      }, 0);
    };

    /**
     * 加载器部分
     */
    this.cacheGC();
    if (!loader.resources?.[url]?.texture) {
      this.loadAsset(url, setup);
    } else {
      // 复用
      setup();
    }
  }

  // 播放gif
  public async addGifFigure(key: string, url: string, presetPosition: 'left' | 'center' | 'right' = 'center') {
    const thisFigureContainer = new WebGALPixiContainer();

    // 移除已有相同 key 的立绘
    const existingIndex = this.figureObjects.findIndex((e) => e.key === key);
    if (existingIndex >= 0) {
      this.removeStageObjectByKey(key);
    }

    // 设置 zIndex（如果 metadata 有）
    const metadata = this.getFigureMetadataByKey(key);
    if (metadata?.zIndex !== undefined) {
      thisFigureContainer.zIndex = metadata.zIndex;
    }

    // 获取 loopMode（默认 true）
    const loopMode: 'true' | 'false' | 'disappear' = metadata?.loop ?? 'true';

    // 添加容器到舞台
    this.figureContainer.addChild(thisFigureContainer);

    // 注册到立绘对象列表
    const figureUuid = uuid();
    this.figureObjects.push({
      uuid: figureUuid,
      key,
      pixiContainer: thisFigureContainer,
      sourceUrl: url,
      sourceType: 'gif',
      sourceExt: 'gif',
    });

    try {
      // 异步加载 buffer
      const buffer = await fetch(url).then((res) => res.arrayBuffer());

      // 解码 GIF
      const gif = await AnimatedGIF.fromBuffer(buffer);

      const originalWidth = gif.width;
      const originalHeight = gif.height;
      const scaleX = this.stageWidth / originalWidth;
      const scaleY = this.stageHeight / originalHeight;
      const targetScale = Math.min(scaleX, scaleY);

      // 设置缩放、锚点、位置
      gif.scale.set(targetScale);
      gif.anchor.set(0.5);
      gif.position.y = this.stageHeight / 2;

      const targetWidth = originalWidth * targetScale;
      const targetHeight = originalHeight * targetScale;

      thisFigureContainer.setBaseY(this.stageHeight / 2);
      if (targetHeight < this.stageHeight) {
        thisFigureContainer.setBaseY(this.stageHeight / 2 + (this.stageHeight - targetHeight) / 2);
      }

      if (presetPosition === 'center') {
        thisFigureContainer.setBaseX(this.stageWidth / 2);
      } else if (presetPosition === 'left') {
        thisFigureContainer.setBaseX(targetWidth / 2);
      } else if (presetPosition === 'right') {
        thisFigureContainer.setBaseX(this.stageWidth - targetWidth / 2);
      }

      thisFigureContainer.pivot.set(0, this.stageHeight / 2);

      // === 🔑 loop 控制 ===
      if (loopMode === 'true') {
        gif.loop = true;
      } else {
        gif.loop = false;
        gif.onComplete = () => {
          if (loopMode === 'false') {
            // 停在最后一帧
            gif.stop();
          } else if (loopMode === 'disappear') {
            // 播完消失
            this.removeStageObjectByKey(key);
          }
        };
      }

      gif.play();
      thisFigureContainer.addChild(gif);
    } catch (e) {
      console.error('GIF 加载失败', e);
    }
  }

  // 实现添加拼好模
  /* eslint-disable complexity */
  public async addJsonlFigure(key: string, jsonlPath: string, presetPosition: 'left' | 'center' | 'right' = 'center') {
    console.log('正在使用聚合模型(JSONL)');

    // ✅ 与 addLive2dFigure 保持一致的可用性守卫
    if (!Live2D.isAvailable) {
      console.warn('Live2D 不可用，addJsonlFigure 终止。');
      return;
    }

    // 先移除同 key 立绘
    const existIdx = this.figureObjects.findIndex((e) => e.key === key);
    if (existIdx >= 0) {
      this.removeStageObjectByKey(key);
    }

    // 新建容器并设置 zIndex
    const container = new WebGALPixiContainer();
    const metadata = this.getFigureMetadataByKey(key);
    if (metadata?.zIndex !== undefined) container.zIndex = metadata.zIndex;

    // 挂载并登记
    this.figureContainer.addChild(container);
    const figureUuid = uuid();
    this.figureObjects.push({
      uuid: figureUuid,
      key,
      pixiContainer: container,
      sourceUrl: jsonlPath,
      sourceExt: 'jsonl',
      sourceType: 'live2d',
    });

    // 读取 JSONL
    let jsonlText = '';
    try {
      const resp = await fetch(jsonlPath);
      jsonlText = await resp.text();
    } catch (e) {
      console.error('读取 JSONL 失败：', jsonlPath, e);
      return;
    }

    const lines = jsonlText.split('\n').filter(Boolean);

    // 收集每行模型配置
    interface ModelConfig {
      path: string;
      id?: string;
      x?: number;
      y?: number;
      xscale?: number;
      yscale?: number;
      bounds?: [number, number, number, number]; // 可选：覆盖 bounds
    }
    const modelConfigs: ModelConfig[] = [];

    // 末行汇总 import（PARAM_IMPORT）
    let paramImport: number | null = null;

    // 解析路径前缀
    const jsonlBaseDir = jsonlPath.substring(0, jsonlPath.lastIndexOf('/') + 1);
    const resolvePath = (p: string) => {
      const normalized = String(p).replace(/^\.\//, '');
      // http(s) 或以 game/ 开头认为是工程根相对路径，不拼接
      if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('game/')) {
        return normalized;
      }
      return jsonlBaseDir + normalized;
    };

    // 解析每行
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);

        // ✅ 末行汇总（motions/expressions/import）不要当模型行处理
        if (obj?.motions || obj?.expressions) {
          if (obj?.import !== undefined) {
            paramImport = Number(obj.import);
            console.info('检测到汇总 import =', paramImport);
          }
          continue;
        }

        if (obj?.path) {
          const fullPath = resolvePath(obj.path);
          const cfg: ModelConfig = {
            path: fullPath,
            id: obj.id,
            x: obj.x,
            y: obj.y,
            xscale: obj.xscale,
            yscale: obj.yscale,
          };

          // 可选 bounds（如果 JSONL 行里有）
          if (Array.isArray(obj.bounds) && obj.bounds.length === 4) {
            cfg.bounds = [Number(obj.bounds[0]), Number(obj.bounds[1]), Number(obj.bounds[2]), Number(obj.bounds[3])];
          }

          modelConfigs.push(cfg);
        }
      } catch (e) {
        console.warn('JSONL 某行解析失败，已跳过：', line);
      }
    }

    if (modelConfigs.length === 0) {
      console.warn('JSONL 无有效模型行：', jsonlPath);
      return;
    }

    // 读取当前 state 里的 motion / expression（与 addLive2dFigure 一致）
    const motionFromState = webgalStore.getState().stage.live2dMotion.find((e) => e.target === key);
    const expressionFromState = webgalStore.getState().stage.live2dExpression.find((e) => e.target === key);
    const motionToSet = motionFromState?.motion ?? '';
    const expressionToSet = expressionFromState?.expression ?? '';

    const models: any[] = [];
    const stageWidth = this.stageWidth;
    const stageHeight = this.stageHeight;

    // 逐个加载并放入容器
    for (const cfg of modelConfigs) {
      const { path: modelPath, x, y, xscale, yscale, bounds } = cfg;

      try {
        const model = await Live2D.Live2DModel.from(modelPath, {
          autoInteract: false,
          // 如果提供了 bounds，就覆盖（与 addLive2dFigure 的用法一致）
          overWriteBounds: bounds ? { x0: bounds[0], y0: bounds[1], x1: bounds[2], y1: bounds[3] } : undefined,
        });

        if (!model) continue;

        // 先隐藏，等统一设置完再显示
        model.visible = false;

        // 计算缩放（与图片/视频一致，尽量填满高度同时不超宽）
        const scaleX = stageWidth / model.width;
        const scaleY = stageHeight / model.height;
        const targetScale = Math.min(scaleX, scaleY);

        const targetWidth = model.width * targetScale;
        const targetHeight = model.height * targetScale;

        const finalScaleX = targetScale * (xscale ?? 1);
        const finalScaleY = targetScale * (yscale ?? 1);

        model.scale.set(finalScaleX, finalScaleY);
        model.anchor.set(0.5);
        model.position.set(x ?? 0, stageHeight / 2 + (y ?? 0));

        // 容器基准位（上下居中，必要时向下补齐）
        container.setBaseY(stageHeight / 2);
        if (targetHeight < stageHeight) {
          container.setBaseY(stageHeight / 2 + (stageHeight - targetHeight) / 2);
        }

        // 左中右预设位
        if (presetPosition === 'center') {
          container.setBaseX(stageWidth / 2);
        } else if (presetPosition === 'left') {
          container.setBaseX(targetWidth / 2);
        } else if (presetPosition === 'right') {
          container.setBaseX(stageWidth - targetWidth / 2);
        }

        container.pivot.set(0, stageHeight / 2);
        container.addChild(model);
        models.push(model);

        // ✨ 细节：禁用角度自动控制，避免抖头
        if (model.internalModel?.angleXParamIndex !== undefined) model.internalModel.angleXParamIndex = 999;
        if (model.internalModel?.angleYParamIndex !== undefined) model.internalModel.angleYParamIndex = 999;
        if (model.internalModel?.angleZParamIndex !== undefined) model.internalModel.angleZParamIndex = 999;

        // ✨ 细节：关闭自动眨眼（保留你项目里的统一眨眼控制权）
        if (model.internalModel?.eyeBlink) {
          // @ts-ignore
          model.internalModel.eyeBlink.blinkInterval = 1000 * 60 * 60 * 24;
          // @ts-ignore
          model.internalModel.eyeBlink.nextBlinkTimeLeft = 1000 * 60 * 60 * 24;
        }

        // ✨ 设置 PARAM_IMPORT（若 JSONL 末行提供）
        if (paramImport !== null) {
          try {
            model.internalModel?.coreModel?.setParamFloat?.('PARAM_IMPORT', paramImport);
            console.info(`设置 PARAM_IMPORT=${paramImport} ->`, modelPath);
          } catch (e) {
            console.warn(`设置 PARAM_IMPORT 失败(${modelPath})`, e);
          }
        }
      } catch (err) {
        console.warn(`加载模型失败：${modelPath}`, err);
      }
    }

    // 统一应用 motion/expression，并显示
    for (const model of models) {
      try {
        if (motionToSet) {
          // @ts-ignore
          model.motion(motionToSet, 0, 3);
        }
        if (expressionToSet) {
          // @ts-ignore
          model.expression(expressionToSet);
        }
        model.visible = true;
      } catch (e) {
        console.warn('设置 motion/expression 失败', e);
      }
    }

    // 记录到状态（与 addLive2dFigure 行为一致）
    if (motionToSet) this.updateL2dMotionByKey(key, motionToSet);
    if (expressionToSet) this.updateL2dExpressionByKey(key, expressionToSet);
  }
  /* eslint-enable complexity */ /* eslint-disable complexity */

  /**
   * WebGAL Mano 立绘（更稳的实现）
   * - 强制用 layer.id 作为 TextureCache key
   * - 使用 URL() 拼接资源路径
   * - 兼容你当前 loader 的 key 行为（name/url 都可能）
   * - 等纹理 ready 后再创建 CharacterPlayer
   */
  public async addManoFigure(key: string, jsonPath: string, pos: 'left' | 'center' | 'right' = 'center') {
    const stageWidth = this.stageWidth;
    const stageHeight = this.stageHeight;

    /** ---------------------------
     * 0. 清理同 key 旧对象
     * --------------------------- */
    const existIdx = this.figureObjects.findIndex((e) => e.key === key);
    if (existIdx >= 0) this.removeStageObjectByKey(key);

    const container = new WebGALPixiContainer();
    this.figureContainer.addChild(container);

    const figureUuid = uuid();
    this.figureObjects.push({
      uuid: figureUuid,
      key,
      pixiContainer: container,
      sourceUrl: jsonPath,
      sourceType: 'webgal_mano',
      sourceExt: 'json',
    });

    try {
      /** ---------------------------
       * 1. 加载 model.char.json
       * --------------------------- */
      const resp = await fetch(jsonPath);
      if (!resp.ok) {
        throw new Error(`Failed to fetch mano json: ${resp.status}`);
      }
      const modelData = await resp.json();
      logger.debug('[webgal_mano] model loaded', {
        name: modelData?.metadata?.name,
        basePath: modelData?.settings?.basePath,
        layers: modelData?.assets?.layers?.length ?? 0,
        baseLayers: modelData?.controller?.baseLayers ?? [],
        defaultPoses: modelData?.controller?.defaultPoses ?? [],
      });

      /** ---------------------------
       * 2. 计算 basePath（绝对 URL）
       * --------------------------- */
      const cleanJsonUrl = jsonPath.split('?')[0];
      const baseDir = cleanJsonUrl.slice(0, cleanJsonUrl.lastIndexOf('/') + 1);
      const basePathFromModel = modelData.settings?.basePath;
      const basePathAbs = new URL(
        basePathFromModel && basePathFromModel !== './' ? basePathFromModel : baseDir,
        window.location.href,
      ).href;

      modelData.settings = modelData.settings ?? {};
      modelData.settings.basePath = basePathAbs;
      logger.debug('[webgal_mano] resolved basePath', { basePathAbs });

      /** ---------------------------
       * 3. 预加载所有 layer 纹理
       *    关键：URL 加载 + id 注册
       * --------------------------- */
      const layers: any[] = modelData.assets?.layers ?? [];
      if (!layers.length) throw new Error('mano layers empty');

      const waitForTextureReady = (texture: PIXI.Texture) =>
        new Promise<void>((resolve) => {
          if (texture.baseTexture.valid) {
            resolve();
            return;
          }
          texture.baseTexture.once('loaded', () => resolve());
          texture.baseTexture.once('error', () => resolve());
        });
      const textures: Record<string, PIXI.Texture> = {};
      const loadLayerTexture = async (id: string, url: string) => {
        if (textures[id]) return;
        // PIXI.Texture.fromURL 会在资源就绪后返回纹理，但仍等待 baseTexture.valid 确保可用
        // @ts-ignore
        const texture = await PIXI.Texture.fromURL(url);
        await waitForTextureReady(texture);
        textures[id] = texture;
        textures[url] = texture;
      };

      await Promise.all(
        layers.map((layer: any) => {
          const id = String(layer.id);
          const url = new URL(String(layer.path), basePathAbs).href;
          return loadLayerTexture(id, url);
        }),
      );
      logger.debug('[webgal_mano] textures ready', {
        total: layers.length,
        cached: Object.keys(textures).length,
      });

      /** ---------------------------
       * 4. 防止对象已被移除
       * --------------------------- */
      if (!this.getStageObjByUuid(figureUuid)) return;

      /** ---------------------------
       * 5. 创建 CharacterPlayer
       * --------------------------- */
      const player = new CharacterPlayer(modelData, textures);

      player.resetToDefault();
      logger.debug('[webgal_mano] player size', { width: player.width, height: player.height });
      const layerSprites = (player as any).layerSprites as Map<string, PIXI.Sprite> | undefined;
      if (layerSprites) {
        let visibleCount = 0;
        let sample: {
          id: string;
          width: number;
          height: number;
          valid: boolean | undefined;
          url: string | undefined;
        } | null = null;
        layerSprites.forEach((sprite, id) => {
          if (sprite.visible) visibleCount += 1;
          if (!sample && sprite.texture) {
            sample = {
              id,
              width: sprite.texture.width,
              height: sprite.texture.height,
              valid: sprite.texture.baseTexture?.valid,
              url: (sprite.texture.baseTexture as any)?.resource?.url,
            };
          }
        });
        logger.debug('[webgal_mano] sprite visibility', {
          visibleCount,
          total: layerSprites.size,
          sample,
        });
      }

      // pivot：底部中心
      player.pivot.set(player.width / 2, player.height);
      // 以容器原点放置，交给容器定位
      player.position.set(0, 0);

      // 缩放适配舞台
      const scaleX = stageWidth / player.width;
      const scaleY = stageHeight / player.height;
      const scale = Math.min(scaleX, scaleY) * 0.9;
      player.scale.set(scale);

      const targetWidth = player.width * scale;

      // 容器定位
      container.setBaseY(stageHeight);
      if (pos === 'center') container.setBaseX(stageWidth / 2);
      if (pos === 'left') container.setBaseX(targetWidth / 2);
      if (pos === 'right') container.setBaseX(stageWidth - targetWidth / 2);

      container.addChild(player);

      /** ---------------------------
       * 6. 应用当前状态 pose
       * --------------------------- */
      const state = webgalStore.getState().stage;

      const motion = state.live2dMotion.find((m) => m.target === key)?.motion;
      if (motion) player.setPose(motion);

      const expression = state.live2dExpression.find((e) => e.target === key)?.expression;
      if (expression) player.setPose(expression);
    } catch (err) {
      console.error('[WebGAL Mano] load error:', err);
      this.removeStageObjectByKey(key);
    }
  }

  /**
   * Live2d立绘，如果要使用 Live2D，取消这里的注释
   * @param jsonPath
   */
  // eslint-disable-next-line max-params
  public addLive2dFigure(key: string, jsonPath: string, pos: string) {
    if (!Live2D.isAvailable) return;
    try {
      let stageWidth = this.stageWidth;
      let stageHeight = this.stageHeight;

      this.figureCash.push(jsonPath);

      const loader = this.assetLoader;
      // 准备用于存放这个立绘的 Container
      const thisFigureContainer = new WebGALPixiContainer();

      // 是否有相同 key 的立绘
      const setFigIndex = this.figureObjects.findIndex((e) => e.key === key);
      const isFigSet = setFigIndex >= 0;

      // 已经有一个这个 key 的立绘存在了
      if (isFigSet) {
        this.removeStageObjectByKey(key);
      }

      const metadata = this.getFigureMetadataByKey(key);
      if (metadata) {
        if (metadata.zIndex) {
          thisFigureContainer.zIndex = metadata.zIndex;
        }
      }
      // 挂载
      this.figureContainer.addChild(thisFigureContainer);
      const figureUuid = uuid();
      this.figureObjects.push({
        uuid: figureUuid,
        key: key,
        pixiContainer: thisFigureContainer,
        sourceUrl: jsonPath,
        sourceType: 'live2d',
        sourceExt: 'json',
      });
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const instance = this;

      const setup = () => {
        if (thisFigureContainer && this.getStageObjByUuid(figureUuid)) {
          (async function () {
            let overrideBounds: [number, number, number, number] = [0, 0, 0, 0];
            const mot = webgalStore.getState().stage.live2dMotion.find((e) => e.target === key);
            if (mot?.overrideBounds) {
              overrideBounds = mot.overrideBounds;
            }
            console.log(overrideBounds);
            const models = await Promise.all([
              Live2D.Live2DModel.from(jsonPath, {
                autoInteract: false,
                overWriteBounds: {
                  x0: overrideBounds[0],
                  y0: overrideBounds[1],
                  x1: overrideBounds[2],
                  y1: overrideBounds[3],
                },
              }),
            ]);

            models.forEach((model) => {
              const scaleX = stageWidth / model.width;
              const scaleY = stageHeight / model.height;
              const targetScale = Math.min(scaleX, scaleY);
              const targetWidth = model.width * targetScale;
              const targetHeight = model.height * targetScale;
              model.scale.x = targetScale;
              model.scale.y = targetScale;
              model.anchor.set(0.5);
              model.pivot.x += (overrideBounds[0] + overrideBounds[2]) * 0.5;
              model.pivot.y += (overrideBounds[1] + overrideBounds[3]) * 0.5;
              model.position.x = 0;
              model.position.y = stageHeight / 2;

              let baseY = stageHeight / 2;
              if (targetHeight < stageHeight) {
                baseY = stageHeight / 2 + (stageHeight - targetHeight) / 2;
              }
              thisFigureContainer.setBaseY(baseY);
              if (pos === 'center') {
                thisFigureContainer.setBaseX(stageWidth / 2);
              } else if (pos === 'left') {
                thisFigureContainer.setBaseX(targetWidth / 2);
              } else if (pos === 'right') {
                thisFigureContainer.setBaseX(stageWidth - targetWidth / 2);
              }

              thisFigureContainer.pivot.set(0, stageHeight / 2);

              let animation_index = 0;
              let priority_number = 3;

              // motion
              let motionToSet = '';
              const motionFromState = webgalStore.getState().stage.live2dMotion.find((e) => e.target === key);
              if (motionFromState) {
                motionToSet = motionFromState.motion;
              }
              instance.updateL2dMotionByKey(key, motionToSet);
              model.motion(motionToSet, animation_index, priority_number);

              // expression
              let expressionToSet = '';
              const expressionFromState = webgalStore.getState().stage.live2dExpression.find((e) => e.target === key);
              if (expressionFromState) {
                expressionToSet = expressionFromState.expression;
              }
              instance.updateL2dExpressionByKey(key, expressionToSet);
              model.expression(expressionToSet);

              // blink
              let blinkToSet: BlinkParam = baseBlinkParam;
              const blinkFromState = webgalStore.getState().stage.live2dBlink.find((e) => e.target === key);
              if (blinkFromState) {
                blinkToSet = { ...blinkToSet, ...blinkFromState.blink };
              }
              instance.updateL2dBlinkByKey(key, blinkToSet);
              model.internalModel?.setBlinkParam(blinkToSet);

              // focus
              let focusToSet: FocusParam = baseFocusParam;
              const focusFromState = webgalStore.getState().stage.live2dFocus.find((e) => e.target === key);
              if (focusFromState) {
                focusToSet = { ...focusToSet, ...focusFromState.focus };
              }
              instance.updateL2dFocusByKey(key, focusToSet);
              model.internalModel?.focusController?.focus(focusToSet.x, focusToSet.y, focusToSet.instant);

              // lip-sync is still a problem and you can not.
              Live2D.SoundManager.volume = 0; // @ts-ignore

              thisFigureContainer.addChild(model);
            });
          })();
        }
      };

      /**
       * 加载器部分
       */
      const resourses = Object.keys(loader.resources);
      this.cacheGC();
      if (!resourses.includes(jsonPath)) {
        this.loadAsset(jsonPath, () => setup());
      } else {
        // 复用
        setup();
      }
    } catch (error) {
      console.error('Live2d Module err: ' + error);
      Live2D.isAvailable = false;
    }
  }

  public addVideoFigure(key: string, url: string, presetPosition: 'left' | 'center' | 'right' = 'center') {
    const thisFigureContainer = new WebGALPixiContainer();

    // 移除已有相同 key 的立绘
    const existingIndex = this.figureObjects.findIndex((e) => e.key === key);
    if (existingIndex >= 0) {
      this.removeStageObjectByKey(key);
    }

    // 设置 zIndex（如果 metadata 有）
    const metadata = this.getFigureMetadataByKey(key);
    if (metadata?.zIndex !== undefined) {
      thisFigureContainer.zIndex = metadata.zIndex;
    }

    // 获取 loop 模式（默认 true）
    const loopMode: 'true' | 'false' | 'disappear' = metadata?.loop ?? 'true';

    // 添加容器到舞台
    this.figureContainer.addChild(thisFigureContainer);

    // 注册到立绘对象列表
    const figureUuid = uuid();
    this.figureObjects.push({
      uuid: figureUuid,
      key,
      pixiContainer: thisFigureContainer,
      sourceUrl: url,
      sourceType: 'video',
      sourceExt: this.getExtName(url),
    });

    // 延迟一帧加载避免卡顿
    setTimeout(() => {
      const video = document.createElement('video');
      video.src = url;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = 'auto';

      // 根据 loopMode 设置循环逻辑
      if (loopMode === 'true') {
        video.loop = true;
      } else {
        video.loop = false;
        video.addEventListener('ended', () => {
          if (loopMode === 'false') {
            // 播完停在最后一帧
            video.pause();
            video.currentTime = video.duration;
          } else if (loopMode === 'disappear') {
            this.removeStageObjectByKey(key);

            // 清 Redux
            const dispatch = webgalStore.dispatch;
            if (key === 'fig-center') {
              dispatch(setStage({ key: 'figName', value: '' }));
            } else if (key === 'fig-left') {
              dispatch(setStage({ key: 'figNameLeft', value: '' }));
            } else if (key === 'fig-right') {
              dispatch(setStage({ key: 'figNameRight', value: '' }));
            } else {
              // 自由立绘
              dispatch(stageActions.setFreeFigureByKey({ key, name: '', basePosition: 'center' }));
            }
          }
        });
      }

      // 创建 PIXI texture
      const texture = PIXI.Texture.from(video);
      const sprite = new PIXI.Sprite(texture);

      // 加载后获取原始宽高
      video.onloadedmetadata = () => {
        const originalWidth = video.videoWidth;
        const originalHeight = video.videoHeight;
        const scaleX = this.stageWidth / originalWidth;
        const scaleY = this.stageHeight / originalHeight;
        const targetScale = Math.min(scaleX, scaleY);

        sprite.scale.set(targetScale);
        sprite.anchor.set(0.5);
        sprite.position.y = this.stageHeight / 2;

        const targetWidth = originalWidth * targetScale;
        const targetHeight = originalHeight * targetScale;

        thisFigureContainer.setBaseY(this.stageHeight / 2);
        if (targetHeight < this.stageHeight) {
          thisFigureContainer.setBaseY(this.stageHeight / 2 + (this.stageHeight - targetHeight) / 2);
        }

        if (presetPosition === 'center') {
          thisFigureContainer.setBaseX(this.stageWidth / 2);
        } else if (presetPosition === 'left') {
          thisFigureContainer.setBaseX(targetWidth / 2);
        } else if (presetPosition === 'right') {
          thisFigureContainer.setBaseX(this.stageWidth - targetWidth / 2);
        }

        thisFigureContainer.pivot.set(0, this.stageHeight / 2);
        thisFigureContainer.addChild(sprite);
      };

      // 错误处理
      video.onerror = (e) => {
        console.error('视频加载失败喵！', e);
      };
    }, 0);
  }

  public changeModelMotionByKey(key: string, motion: string) {
    // logger.debug(`Applying motion ${motion} to ${key}`);
    const target = this.figureObjects.find((e) => e.key === key && !e.isExiting);
    if (target?.sourceType === 'live2d') {
      const figureRecordTarget = this.live2dFigureRecorder.find((e) => e.target === key);
      if (target && figureRecordTarget?.motion !== motion) {
        const container = target.pixiContainer;
        const children = container.children;
        for (const model of children) {
          let category_name = motion;
          let animation_index = 0;
          let priority_number = 3; // @ts-ignore
          const internalModel = model?.internalModel ?? undefined; // 安全访问
          internalModel?.motionManager?.stopAllMotions?.();
          // @ts-ignore
          model.motion(category_name, animation_index, priority_number);
        }
        this.updateL2dMotionByKey(key, motion);
      }
    } else if (target?.sourceType === 'spine') {
      // 处理 Spine 动画切换
      this.changeSpineAnimationByKey(key, motion);
    } else if (target?.sourceType === 'webgal_mano') {
      const player = target.pixiContainer.children[0] as any; // CharacterPlayer
      if (player && typeof player.setPose === 'function') {
        const poseList = motion
          .split(',')
          .map((pose) => pose.trim())
          .filter(Boolean);
        if (poseList.length === 0) return;
        poseList.forEach((pose) => player.setPose(pose));
      }
    }
  }

  public changeSpineAnimationByKey(key: string, animation: string) {
    const target = this.figureObjects.find((e) => e.key === key && !e.isExiting);
    if (target?.sourceType !== 'spine') return;

    const container = target.pixiContainer;
    // Spine figure 结构: Container -> Sprite -> Spine
    const sprite = container.children[0] as PIXI.Container;
    if (sprite?.children?.[0]) {
      const spineObject = sprite.children[0];
      // @ts-ignore
      if (spineObject.state && spineObject.spineData) {
        // @ts-ignore
        const animationExists = spineObject.spineData.animations.find((anim: any) => anim.name === animation);
        let targetCurrentAnimation = target?.spineAnimation ?? '';
        if (animationExists && targetCurrentAnimation !== animation) {
          console.log(`setting animation ${animation}`);
          target!.spineAnimation = animation;
          // @ts-ignore
          spineObject.state.setAnimation(0, animation, false);
        }
      }
    }
  }

  public changeModelExpressionByKey(key: string, expression: string) {
    // logger.debug(`Applying expression ${expression} to ${key}`);
    const target = this.figureObjects.find((e) => e.key === key && !e.isExiting);
    if (target?.sourceType === 'live2d') {
      const figureRecordTarget = this.live2dFigureRecorder.find((e) => e.target === key);
      if (target && figureRecordTarget?.expression !== expression) {
        const container = target.pixiContainer;
        const children = container.children;
        for (const model of children) {
          // @ts-ignore
          model.expression(expression);
        }
        this.updateL2dExpressionByKey(key, expression);
      }
    } else if (target?.sourceType === 'webgal_mano') {
      const player = target.pixiContainer.children[0] as any; // CharacterPlayer
      if (player && typeof player.setPose === 'function') {
        player.setPose(expression);
      }
    }
  }

  public changeModelBlinkByKey(key: string, blinkParam: BlinkParam) {
    const target = this.figureObjects.find((e) => e.key === key && !e.isExiting);
    if (target?.sourceType !== 'live2d') return;
    const figureRecordTarget = this.live2dFigureRecorder.find((e) => e.target === key);
    if (target && !isEqual(figureRecordTarget?.blink, blinkParam)) {
      const container = target.pixiContainer;
      const children = container.children;
      let newBlinkParam: BlinkParam = { ...baseBlinkParam, ...blinkParam };
      // 继承现有 BlinkParam
      if (figureRecordTarget?.blink) {
        newBlinkParam = { ...cloneDeep(figureRecordTarget.blink), ...blinkParam };
      }
      for (const model of children) {
        // @ts-ignore
        model?.internalModel?.setBlinkParam?.(newBlinkParam);
      }
      this.updateL2dBlinkByKey(key, newBlinkParam);
    }
  }

  public changeModelFocusByKey(key: string, focusParam: FocusParam) {
    const target = this.figureObjects.find((e) => e.key === key && !e.isExiting);
    if (target?.sourceType !== 'live2d') return;
    const figureRecordTarget = this.live2dFigureRecorder.find((e) => e.target === key);
    if (target && !isEqual(figureRecordTarget?.focus, focusParam)) {
      const container = target.pixiContainer;
      const children = container.children;
      let newFocusParam: FocusParam = { ...baseFocusParam, ...focusParam };
      // 继承现有 FocusParam
      if (figureRecordTarget?.focus) {
        newFocusParam = { ...cloneDeep(figureRecordTarget.focus), ...focusParam };
      }
      for (const model of children) {
        // @ts-ignore
        model?.internalModel?.focusController.focus(newFocusParam.x, newFocusParam.y, newFocusParam.instant);
      }
      this.updateL2dFocusByKey(key, newFocusParam);
    }
  }

  public setModelMouthY(key: string, y: number) {
    function mapToZeroOne(value: number) {
      return value < 50 ? 0 : (value - 50) / 50;
    }

    const paramY = mapToZeroOne(y);
    const target = this.figureObjects.find((e) => e.key === key);
    if (target && target.sourceType === 'live2d') {
      const container = target.pixiContainer;
      const children = container.children;
      for (const model of children) {
        // @ts-ignore
        if (model?.internalModel) {
          // @ts-ignore
          if (model?.internalModel?.coreModel?.setParamFloat)
            // @ts-ignore
            model?.internalModel?.coreModel?.setParamFloat?.('PARAM_MOUTH_OPEN_Y', paramY);
          // @ts-ignore
          if (model?.internalModel?.coreModel?.setParameterValueById)
            // @ts-ignore
            model?.internalModel?.coreModel?.setParameterValueById('ParamMouthOpenY', paramY);
        }
      }
    }
  }

  /**
   * 根据 key 获取舞台上的对象
   * @param key
   */
  public getStageObjByKey(key: string) {
    // 先检查 itemObjects，然后检查其他对象
    const itemObj = this.itemObjects.find((e) => e.key === key);
    if (itemObj) {
      return itemObj;
    }
    return [...this.figureObjects, ...this.backgroundObjects, this.mainStageObject].find((e) => e.key === key);
  }

  public getItemObjByKey(key: string) {
    return this.itemObjects.find((e) => e.key === key);
  }

  public getStageObjByUuid(objUuid: string) {
    return [...this.figureObjects, ...this.backgroundObjects, this.mainStageObject].find((e) => e.uuid === objUuid);
  }

  public getAllStageObj() {
    return [...this.figureObjects, ...this.backgroundObjects, ...this.itemObjects, this.mainStageObject];
  }

  /**
   * 根据 key 删除舞台上的对象
   * @param key
   */
  public removeStageObjectByKey(key: string) {
    const indexFig = this.figureObjects.findIndex((e) => e.key === key);
    const indexBg = this.backgroundObjects.findIndex((e) => e.key === key);
    if (indexFig >= 0) {
      const bgSprite = this.figureObjects[indexFig];
      for (const element of bgSprite.pixiContainer.children) {
        element.destroy();
      }
      bgSprite.pixiContainer.destroy();
      this.figureContainer.removeChild(bgSprite.pixiContainer);
      this.figureObjects.splice(indexFig, 1);
    }
    if (indexBg >= 0) {
      const bgSprite = this.backgroundObjects[indexBg];
      for (const element of bgSprite.pixiContainer.children) {
        element.destroy();
      }
      bgSprite.pixiContainer.destroy();
      this.backgroundContainer.removeChild(bgSprite.pixiContainer);
      this.backgroundObjects.splice(indexBg, 1);
    }
    // /**
    //  * 删掉相关 Effects，因为已经移除了
    //  */
    // const prevEffects = webgalStore.getState().stage.effects;
    // const newEffects = __.cloneDeep(prevEffects);
    // const index = newEffects.findIndex((e) => e.target === key);
    // if (index >= 0) {
    //   newEffects.splice(index, 1);
    // }
    // updateCurrentEffects(newEffects);
  }

  /**
   * 根据 key 删除 item 对象
   * @param key
   */
  public removeItemObjectByKey(key: string) {
    const indexItem = this.itemObjects.findIndex((e) => e.key === key);
    if (indexItem >= 0) {
      const itemSprite = this.itemObjects[indexItem];
      for (const element of itemSprite.pixiContainer.children) {
        element.destroy();
      }
      itemSprite.pixiContainer.destroy();
      this.itemContainer.removeChild(itemSprite.pixiContainer);
      this.itemObjects.splice(indexItem, 1);
    }
    this.updateItemContainerPointerEvents();
  }

  /**
   * 更新 itemContainer 的 pointer-events 状态
   */
  private updateItemContainerPointerEvents() {
    const itemContainerElement = document.getElementById('itemContainer');
    if (itemContainerElement) {
      const canvas = itemContainerElement.querySelector('canvas');
      if (canvas) {
        if (this.itemObjects.length > 0) {
          canvas.style.pointerEvents = 'auto';
          logger.debug(`ItemContainer: 启用 canvas pointer-events，当前 item 数量: ${this.itemObjects.length}`);
        } else {
          canvas.style.pointerEvents = 'none';
          logger.debug('ItemContainer: 禁用 canvas pointer-events');
        }
      } else {
        logger.warn('ItemContainer: 找不到 canvas 元素');
      }
    } else {
      logger.warn('ItemContainer: 找不到 itemContainer 元素');
    }
  }

  /**
   * 添加 Item
   * @param key Item 的标识
   * @param url Item 图片 url
   * @param presetPosition 预设位置
   */
  public addItem(key: string, url: string, presetPosition: 'left' | 'center' | 'right' = 'center') {
    if (!this.itemApp) {
      logger.warn('Item App 未初始化');
      return;
    }

    const loader = this.itemApp.loader;
    // 准备用于存放这个 item 的 Container
    const thisItemContainer = new WebGALPixiContainer();

    // 是否有相同 key 的 item
    const setItemIndex = this.itemObjects.findIndex((e) => e.key === key);
    const isItemSet = setItemIndex >= 0;

    // 已经有一个这个 key 的 item 存在了
    if (isItemSet) {
      this.removeItemObjectByKey(key);
    }

    const metadata = this.getFigureMetadataByKey(key);
    if (metadata) {
      if (metadata.zIndex) {
        thisItemContainer.zIndex = metadata.zIndex;
      }
    }
    // 挂载
    this.itemContainer.addChild(thisItemContainer);
    const itemUuid = uuid();
    this.itemObjects.push({
      uuid: itemUuid,
      key: key,
      pixiContainer: thisItemContainer,
      sourceUrl: url,
      sourceType: 'img',
      sourceExt: this.getExtName(url),
    });
    this.updateItemContainerPointerEvents();

    // 完成图片加载后执行的函数
    const setup = () => {
      setTimeout(() => {
        const texture = loader.resources?.[url]?.texture;
        if (texture && this.getItemObjByKey(key)) {
          /**
           * 重设大小
           */
          const originalWidth = texture.width;
          const originalHeight = texture.height;
          const scaleX = this.stageWidth / originalWidth;
          const scaleY = this.stageHeight / originalHeight;
          const targetScale = Math.min(scaleX, scaleY);
          const itemSprite = new PIXI.Sprite(texture);
          // 启用交互
          itemSprite.interactive = true;
          itemSprite.buttonMode = true;
          itemSprite.cursor = 'pointer';
          itemSprite.scale.x = targetScale;
          itemSprite.scale.y = targetScale;
          itemSprite.anchor.set(0.5);
          itemSprite.position.y = this.stageHeight / 2;
          const targetWidth = originalWidth * targetScale;
          const targetHeight = originalHeight * targetScale;
          thisItemContainer.setBaseY(this.stageHeight / 2);
          if (targetHeight < this.stageHeight) {
            thisItemContainer.setBaseY(this.stageHeight / 2 + (this.stageHeight - targetHeight) / 2);
          }
          if (presetPosition === 'center') {
            thisItemContainer.setBaseX(this.stageWidth / 2);
          }
          if (presetPosition === 'left') {
            thisItemContainer.setBaseX(targetWidth / 2);
          }
          if (presetPosition === 'right') {
            thisItemContainer.setBaseX(this.stageWidth - targetWidth / 2);
          }
          thisItemContainer.pivot.set(0, this.stageHeight / 2);
          thisItemContainer.addChild(itemSprite);
          this.updateItemContainerPointerEvents();
        }
      }, 0);
    };

    /**
     * 加载器部分
     */
    if (!loader.resources?.[url]?.texture) {
      loader.add(url, url).load(() => {
        setup();
      });
    } else {
      // 复用
      setup();
    }
  }

  public cacheGC() {
    PIXI.utils.clearTextureCache();
  }

  public getExtName(url: string) {
    return url.split('.').pop() ?? 'png';
  }

  public getFigureMetadataByKey(key: string): IFigureMetadata | undefined {
    console.log(key, webgalStore.getState().stage.figureMetaData);
    return webgalStore.getState().stage.figureMetaData[key];
  }

  public loadAsset(url: string, callback: () => void, name?: string) {
    /**
     * Loader 复用疑似有问题，转而采用先前的单独方式
     */
    this.loadQueue.unshift({ url, callback, name });
    /**
     * 尝试启动加载
     */
    this.callLoader();
  }

  private updateL2dMotionByKey(target: string, motion: string) {
    const figureTargetIndex = this.live2dFigureRecorder.findIndex((e) => e.target === target);
    if (figureTargetIndex >= 0) {
      this.live2dFigureRecorder[figureTargetIndex].motion = motion;
    } else {
      this.live2dFigureRecorder.push({ target, motion, expression: '', blink: baseBlinkParam, focus: baseFocusParam });
    }
  }

  private updateL2dExpressionByKey(target: string, expression: string) {
    const figureTargetIndex = this.live2dFigureRecorder.findIndex((e) => e.target === target);
    if (figureTargetIndex >= 0) {
      this.live2dFigureRecorder[figureTargetIndex].expression = expression;
    } else {
      this.live2dFigureRecorder.push({ target, motion: '', expression, blink: baseBlinkParam, focus: baseFocusParam });
    }
  }

  private updateL2dBlinkByKey(target: string, blink: BlinkParam) {
    const figureTargetIndex = this.live2dFigureRecorder.findIndex((e) => e.target === target);
    if (figureTargetIndex >= 0) {
      this.live2dFigureRecorder[figureTargetIndex].blink = blink;
    } else {
      this.live2dFigureRecorder.push({ target, motion: '', expression: '', blink, focus: baseFocusParam });
    }
  }

  private updateL2dFocusByKey(target: string, focus: FocusParam) {
    const figureTargetIndex = this.live2dFigureRecorder.findIndex((e) => e.target === target);
    if (figureTargetIndex >= 0) {
      this.live2dFigureRecorder[figureTargetIndex].focus = focus;
    } else {
      this.live2dFigureRecorder.push({ target, motion: '', expression: '', blink: baseBlinkParam, focus });
    }
  }

  private callLoader() {
    if (!this.assetLoader.loading) {
      const front = this.loadQueue.shift();
      if (front) {
        try {
          if (this.assetLoader.resources[front.url]) {
            front.callback();
            this.callLoader();
          } else {
            if (front.name) {
              this.assetLoader.add(front.name, front.url).load(() => {
                front.callback();
                this.callLoader();
              });
            } else {
              this.assetLoader.add(front.url).load(() => {
                front.callback();
                this.callLoader();
              });
            }
          }
        } catch (error) {
          logger.fatal('PIXI Loader 故障', error);
          front.callback();
          // this.assetLoader.reset(); // 暂时先不用重置
          this.callLoader();
        }
      }
    }
  }

  private updateFps() {
    getScreenFps?.(120).then((fps) => {
      this.frameDuration = 1000 / (fps as number);
      // logger.info('当前帧率', fps);
    });
  }

  private lockStageObject(targetName: string) {
    this.lockTransformTarget.push(targetName);
  }

  private unlockStageObject(targetName: string) {
    const index = this.lockTransformTarget.findIndex((name) => name === targetName);
    if (index >= 0) this.lockTransformTarget.splice(index, 1);
  }

  private async initialize() {
    // 动态加载 figureCash
    try {
      const { figureCash } = await import('@/Core/gameScripts/vocal/conentsCash');
      this.figureCash = figureCash;
    } catch (error) {
      console.error('Failed to load figureCash:', error);
    }
  }
}

function updateCurrentBacklogEffects(newEffects: IEffect[]) {
  /**
   * 更新当前 backlog 条目的 effects 记录
   */
  setTimeout(() => {
    WebGAL.backlogManager.editLastBacklogItemEffect(cloneDeep(newEffects));
  }, 50);

  webgalStore.dispatch(setStage({ key: 'effects', value: newEffects }));
}

/**
 * @param {number} targetCount 不小于1的整数，表示经过targetCount帧之后返回结果
 * @return {Promise<number>}
 */
const getScreenFps = (() => {
  // 先做一下兼容性处理
  const nextFrame = [
    window.requestAnimationFrame,
    // @ts-ignore
    window.webkitRequestAnimationFrame,
    // @ts-ignore
    window.mozRequestAnimationFrame,
  ].find((fn) => fn);
  if (!nextFrame) {
    console.error('requestAnimationFrame is not supported!');
    return;
  }
  return (targetCount = 60) => {
    // 判断参数是否合规
    if (targetCount < 1) throw new Error('targetCount cannot be less than 1.');
    const beginDate = Date.now();
    let count = 0;
    return new Promise((resolve) => {
      (function log() {
        nextFrame(() => {
          if (++count >= targetCount) {
            const diffDate = Date.now() - beginDate;
            const fps = (count / diffDate) * 1000;
            return resolve(fps);
          }
          log();
        });
      })();
    });
  };
})();
