import { IWebGalTextBoxTheme } from '@/Stage/themeInterface';

/**
 * 当前Menu页面显示的Tag
 */
export enum MenuPanelTag {
  Save,
  Load,
  Option,
}

/**
 * @interface IGuiState GUI状态接口
 */
export interface IGuiState {
  fontOptions: FontOption[];
  showStarter: boolean;
  showTitle: boolean;
  showMenuPanel: boolean;
  showTextBox: boolean;
  showControls: boolean;
  controlsVisibility: boolean;
  currentMenuTag: MenuPanelTag;
  showBacklog: boolean;
  titleBgm: string;
  titleBg: string;
  logoImage: string[];
  showExtra: boolean;
  showGlobalDialog: boolean;
  showPanicOverlay: boolean;
  isEnterGame: boolean;
  isShowLogo: boolean;
  enableAppreciationMode: boolean;
  fontOptimization: boolean;
  showPhone: boolean;
  showManopediaUpdate: boolean;
  manopediaUpdateItem: {
    itemId: string;
    itemName: string;
    itemImage: string;
  } | null;
  showItem: boolean;
  showItemInfo: {
    itemId: string;
    itemName: string;
    itemImage: string;
  } | null;
  theme?: IWebGalTextBoxTheme;
}

export type componentsVisibility = Pick<
  IGuiState,
  Exclude<keyof IGuiState, 'currentMenuTag' | 'titleBg' | 'titleBgm' | 'logoImage' | 'theme' | 'fontOptions' | 'manopediaUpdateItem' | 'showItemInfo'>
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

export type FontOptionSource = 'default' | 'template';

export interface FontOption {
  family: string;
  source: FontOptionSource;
  labelKey?: string;
  label?: string;
}