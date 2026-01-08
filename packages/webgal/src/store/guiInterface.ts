import { IWebGalTextBoxTheme } from '@/Stage/themeInterface';

/**
 * 当前Menu页面显示的Tag
 */
export enum MenuPanelTag {
  Save, // “保存”选项卡
  Load, // “读取”选项卡
  Option, // “设置”选项卡
}

/**
 * @interface IGuiState GUI状态接口
 */
export interface IGuiState {
  showStarter: boolean; // 是否显示初始界面（用于使得bgm可以播放)
  showTitle: boolean; // 是否显示标题界面
  showMenuPanel: boolean; // 是否显示Menu界面
  showTextBox: boolean;
  showControls: boolean;
  controlsVisibility: boolean;
  currentMenuTag: MenuPanelTag; // 当前Menu界面的选项卡
  showBacklog: boolean;
  titleBgm: string; // 标题背景音乐
  titleBg: string; // 标题背景图片
  logoImage: string[];
  showExtra: boolean;
  showGlobalDialog: boolean;
  showPanicOverlay: boolean;
  isEnterGame: boolean;
  isShowLogo: boolean;
  enableAppreciationMode: boolean; // Pc102
  fontOptimization: boolean; // 字体优化
  showPhone: boolean; // 是否显示 Phone 界面
  showManopediaUpdate: boolean; // 是否显示魔女图鉴更新提示
  manopediaUpdateItem: {
    itemId: string;
    itemName: string;
    itemImage: string;
  } | null; // 魔女图鉴更新提示的物品信息
  showItem: boolean; // 是否显示物品提示（只显示物品图片）
  showItemInfo: {
    itemId: string;
    itemName: string;
    itemImage: string;
  } | null; // 物品提示的物品信息
}

export type componentsVisibility = Pick<
  IGuiState,
  Exclude<keyof IGuiState, 'currentMenuTag' | 'titleBg' | 'titleBgm' | 'logoImage' | 'theme' | 'manopediaUpdateItem' | 'showItemInfo'>
>;
// 标题资源
export type GuiAsset = Pick<IGuiState, 'titleBgm' | 'titleBg'>;

export interface IGuiStore {
  GuiState: IGuiState;
  setGuiAsset: <K extends keyof GuiAsset>(key: K, value: string) => void;
  setVisibility: <K extends keyof componentsVisibility>(key: K, value: boolean) => void;
  setMenuPanelTag: (value: MenuPanelTag) => void;
}

export interface setVisibilityPayload {
  component: keyof componentsVisibility;
  visibility: boolean;
  itemInfo?: {
    itemId: string;
    itemName: string;
    itemImage: string;
  };
}

export interface setAssetPayload {
  asset: keyof GuiAsset;
  value: string;
}

export type GuiStore = IGuiStore;
