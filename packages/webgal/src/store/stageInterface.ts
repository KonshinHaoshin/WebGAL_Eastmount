import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { BlinkParam, FocusParam } from '@/Core/live2DCore';

/**
 * 游戏内变量
 * @interface IGameVar
 */
export interface IGameVar {
  [propName: string]: string | boolean | number | Array<string | boolean | number>;
}

export interface ISetGameVar {
  key: string;
  value: string | boolean | number;
}

/**
 * 单个选项
 * @interface IChooseItem
 */
export interface IChooseItem {
  key: string; // 选项名称
  targetScene: string; // 选项target
  isSubScene: boolean; // 是否是子场景调用
}

export interface ITransform {
  alpha: number;
  scale: {
    x: number;
    y: number;
  };
  // pivot: {
  //   x: number;
  //   y: number;
  // };
  position: {
    x: number;
    y: number;
  };
  rotation: number;
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  gamma: number;
  colorRed: number;
  colorGreen: number;
  colorBlue: number;
  bevel: number;
  bevelThickness: number;
  bevelRotation: number;
  bevelSoftness: number;
  bevelRed: number;
  bevelGreen: number;
  bevelBlue: number;
  bloom: number;
  bloomBrightness: number;
  bloomBlur: number;
  bloomThreshold: number;
  shockwaveFilter: number;
  radiusAlphaFilter: number;
}

/**
 * 基本效果接口
 * @interface IEffect
 */
export interface IEffect {
  target: string; // 作用目标
  transform?: ITransform; // 变换
}

export interface IStageAnimationSetting {
  target: string;
  enterAnimationName?: string;
  exitAnimationName?: string;
  enterDuration?: number;
  exitDuration?: number;
}

export type StageAnimationSettingUpdatableKey = Exclude<keyof IStageAnimationSetting, 'target'>;

export interface IUpdateAnimationSettingPayload {
  target: string;
  key: StageAnimationSettingUpdatableKey;
  value: IStageAnimationSetting[StageAnimationSettingUpdatableKey];
}

/**
 * 基本变换预设
 */
export const baseTransform: ITransform = {
  alpha: 1,
  scale: {
    x: 1,
    y: 1,
  },
  // pivot: {
  //   x: 0.5,
  //   y: 0.5,
  // },
  position: {
    x: 0,
    y: 0,
  },
  rotation: 0,
  blur: 0,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  gamma: 1,
  colorRed: 255,
  colorGreen: 255,
  colorBlue: 255,
  bevel: 0,
  bevelThickness: 0,
  bevelRotation: 0,
  bevelSoftness: 0,
  bevelRed: 255,
  bevelGreen: 255,
  bevelBlue: 255,
  bloom: 0,
  bloomBrightness: 1,
  bloomBlur: 0,
  bloomThreshold: 0,
  shockwaveFilter: 0,
  radiusAlphaFilter: 0,
};

export interface IFreeFigure {
  basePosition: 'left' | 'center' | 'right';
  name: string;
  key: string;
}

export interface IFigureAssociatedAnimation {
  mouthAnimation: IMouthAnimationFile;
  blinkAnimation: IEyesAnimationFile;
  targetId: string;
  animationFlag: string;
}

export interface IMouthAnimationFile {
  open: string;
  close: string;
  halfOpen: string;
}

export interface IEyesAnimationFile {
  open: string;
  close: string;
}

/**
 * 启动演出接口
 * @interface IRunPerform
 */
export interface IRunPerform {
  id: string;
  isHoldOn: boolean; // 演出类型
  script: ISentence; // 演出脚本
}

export interface ILive2DMotion {
  target: string;
  motion: string;
  overrideBounds?: [number, number, number, number];
}

export interface ILive2DExpression {
  target: string;
  expression: string;
}

export interface ILive2DBlink {
  target: string;
  blink: BlinkParam;
}

export interface ILive2DFocus {
  target: string;
  focus: FocusParam;
}

export interface IFigureMetadata {
  zIndex?: number;
  loop?: 'true' | 'false' | 'disappear'; // 视频立绘播放模式
  lut?: string; // 立绘的LUT文件路径
}

type figureMetaData = Record<string, IFigureMetadata>;

/**
 * 仓库物品接口
 */
export interface IInventoryItem {
  id: string; // 物品ID
  name: string; // 物品名称
  count: number; // 物品数量
}

/**
 * 仓库接口
 */
export interface IInventory {
  items: Record<string, IInventoryItem>; // 以物品ID为键的物品字典
}

/**
 * 添加/移除物品的Payload
 */
export interface IModifyInventoryItemPayload {
  itemId: string;
  count: number; // 正数为添加，负数为移除
  name?: string; // 如果物品不存在，需要提供名称
}

/**
 * 行内思考菜单数据接口
 */
export interface IInlineThinking {
  avatar: string;
  options: { label: string; target: string; icon?: string }[];
}

/**
 * 证言数据接口
 */
export interface ITestimonyData {
  content: string;
  refutes: Record<string, string>;
  colors: Record<string, string>;
  pos?: 'left' | 'right' | 'center';
  y?: number; // 新增：控制Y轴位置
}

/**
 * @interface IStageState 游戏舞台数据接口
 */
export interface IStageState {
  oldBgName: string; // 旧背景的文件路径
  bgName: string; // 背景文件地址（相对或绝对）
  figName: string; // 立绘_中
  figNameLeft: string; // 立绘_左
  figNameRight: string; // 立绘_右
  freeFigure: Array<IFreeFigure>;
  figureAssociatedAnimation: Array<IFigureAssociatedAnimation>;
  showText: string;
  showTextSize: number;
  showName: string;
  command: string;
  choose: Array<IChooseItem>;
  vocal: string;
  playVocal: string;
  vocalVolume: number;
  bgm: {
    src: string;
    enter: number;
    volume: number;
  };
  uiSe: string;
  miniAvatar: string;
  GameVar: IGameVar;
  effects: Array<IEffect>;
  animationSettings: Array<IStageAnimationSetting>;
  bgTransform: string;
  bgFilter: string;
  bgLut?: string;
  PerformList: Array<IRunPerform>;
  currentDialogKey: string;
  live2dMotion: ILive2DMotion[];
  live2dExpression: ILive2DExpression[];
  live2dBlink: ILive2DBlink[];
  live2dFocus: ILive2DFocus[];
  currentConcatDialogPrev: string;
  enableFilm: string;
  judgment: string;
  judgmentTimer: number;
  judgmentTimeout: string;
  isJudgmentFastForward: boolean;
  isDisableTextbox: boolean;
  replacedUIlable: Record<string, string>;
  figureMetaData: figureMetaData;
  enableManopedia: boolean;
  inventory: IInventory;
  viewingItemId: string | null;
  viewingItemCount: number;
  isEvidenceMode: boolean;
  evidenceTarget: string;
  evidenceJumpScenes: string[];
  showManopedia: boolean;
  testimonyData: ITestimonyData[];
  inlineThinking: IInlineThinking | null;
}

/**
 * @interface ISetStagePayload 设置舞台状态的Action的Payload的数据接口
 */
export interface ISetStagePayload {
  key: keyof IStageState;
  value: any;
}

export interface IStageStore {
  stageState: IStageState;
  setStage: <K extends keyof IStageState>(key: K, value: any) => void;
  getStageState: () => IStageState;
  restoreStage: (newState: IStageState) => void;
}

export type StageStore = IStageStore;