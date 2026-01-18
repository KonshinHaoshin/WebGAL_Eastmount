import { getStorage } from '@/Core/controller/storage/storageController';
import {
  FontOption,
  GuiAsset,
  IGuiState,
  MenuPanelTag,
  setAssetPayload,
  setVisibilityPayload,
} from '@/store/guiInterface';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_FONT_OPTIONS } from '@/Core/util/fonts/fontOptions';

/**
 * 初始GUI状态表
 */
const initState: IGuiState = {
  fontOptions: [...DEFAULT_FONT_OPTIONS],
  showBacklog: false,
  showStarter: true,
  showTitle: true,
  showMenuPanel: false,
  showTextBox: true,
  showControls: true,
  controlsVisibility: true,
  currentMenuTag: MenuPanelTag.Option,
  titleBg: '',
  titleBgm: '',
  logoImage: [],
  showExtra: false,
  showGlobalDialog: false,
  showPanicOverlay: false,
  isEnterGame: false,
  isShowLogo: true,
  enableAppreciationMode: false,
  fontOptimization: false,
  showPhone: false,
  showManopediaUpdate: false,
  manopediaUpdateItem: null,
  showItem: false,
  showItemInfo: null,
};

/**
 * GUI状态的Reducer
 */
const GUISlice = createSlice({
  name: 'gui',
  initialState: initState,
  reducers: {
    /**
     * 设置GUI的各组件的显示状态
     * @param state 当前GUI状态
     * @param action 改变显示状态的Action
     */
    setVisibility: (state, action: PayloadAction<setVisibilityPayload>) => {
      getStorage();
      const { component, visibility, itemInfo } = action.payload;
      state[component] = visibility;

      if (component === 'showManopediaUpdate' && itemInfo) {
        state.manopediaUpdateItem = itemInfo;
      } else if (component === 'showManopediaUpdate' && !visibility) {
        state.manopediaUpdateItem = null;
      }

      if (component === 'showItem' && itemInfo) {
        state.showItemInfo = itemInfo;
      } else if (component === 'showItem' && !visibility) {
        state.showItemInfo = null;
      }
    },
    /**
     * 设置MenuPanel的当前选中项
     */
    setMenuPanelTag: (state, action: PayloadAction<MenuPanelTag>) => {
      getStorage();
      state.currentMenuTag = action.payload;
    },
    /**
     * 设置GUI资源的值
     */
    setGuiAsset: (state, action: PayloadAction<setAssetPayload>) => {
      const { asset, value } = action.payload;
      state[asset] = value;
    },
    setLogoImage: (state, action: PayloadAction<string[]>) => {
      state.logoImage = [...action.payload];
    },
    /**
     * 设置 enableAppreciationMode 属性
     */
    setEnableAppreciationMode: (state, action: PayloadAction<boolean>) => {
      state.enableAppreciationMode = action.payload;
    },
    setFontOptimization: (state, action: PayloadAction<boolean>) => {
      state.fontOptimization = action.payload;
    },
    setFontOptions: (state, action: PayloadAction<FontOption[]>) => {
      state.fontOptions = [...action.payload];
    },
  },
});

export const {
  setVisibility,
  setMenuPanelTag,
  setGuiAsset,
  setLogoImage,
  setEnableAppreciationMode,
  setFontOptimization,
  setFontOptions,
} = GUISlice.actions;
export default GUISlice.reducer;