import { language } from '@/config/language';
import {
  IAppreciationAsset,
  IOptionData,
  ISaveData,
  ISetOptionDataPayload,
  ISetUserDataPayload,
  IUserData,
  fullScreenOption,
  playSpeed,
  textFont,
  textSize,
  voiceOption,
} from '@/store/userDataInterface';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import cloneDeep from 'lodash/cloneDeep';
import { ISetGameVar } from './stageInterface';

const initialOptionSet: IOptionData = {
  slPage: 1,
  volumeMain: 100,
  textSpeed: 75,
  autoSpeed: 100,
  textSize: textSize.medium,
  vocalVolume: 100,
  bgmVolume: 25,
  seVolume: 100,
  uiSeVolume: 50,
  textboxFont: textFont.song,
  textboxOpacity: 100,
  language: language.zhCn,
  voiceInterruption: voiceOption.yes,
  fullScreen: fullScreenOption.off,
};

// 初始化用户数据
export const initState: IUserData = {
  optionData: initialOptionSet,
  scriptManagedGlobalVar: [],
  globalGameVar: {},
  appreciationData: {
    bgm: [],
    cg: [],
  },
};

const userDataSlice = createSlice({
  name: 'userData',
  initialState: cloneDeep(initState),
  reducers: {
    setUserData: (state, action: PayloadAction<ISetUserDataPayload>) => {
      const { key, value } = action.payload;
      state[key] = value;
    },
    unlockCgInUserData: (state, action: PayloadAction<IAppreciationAsset>) => {
      const { url, series } = action.payload;
      let isExist = false;
      state.appreciationData.cg.forEach((e) => {
        if (url === e.url) {
          isExist = true;
          e.url = url;
          e.series = series;
        }
      });
      if (!isExist) {
        state.appreciationData.cg.push(action.payload);
      }
    },
    unlockBgmInUserData: (state, action: PayloadAction<IAppreciationAsset>) => {
      const { url, series } = action.payload;
      let isExist = false;
      state.appreciationData.bgm.forEach((e) => {
        if (url === e.url) {
          isExist = true;
          e.url = url;
          e.series = series;
        }
      });
      if (!isExist) {
        state.appreciationData.bgm.push(action.payload);
      }
    },
    resetUserData: (state, action: PayloadAction<IUserData>) => {
      Object.assign(state, action.payload);
    },
    setOptionData: (state, action: PayloadAction<ISetOptionDataPayload>) => {
      const { key, value } = action.payload;
      (state.optionData as any)[key] = value;
    },
    setGlobalVar: (state, action: PayloadAction<ISetGameVar>) => {
      const isRegistedInUserData = state.scriptManagedGlobalVar.findIndex((key) => key === action.payload.key) >= 0;
      if (!isRegistedInUserData) {
        state.globalGameVar[action.payload.key] = action.payload.value;
      }
    },
    setScriptManagedGlobalVar: (state, action: PayloadAction<ISetGameVar>) => {
      const isRegistedInUserData = state.scriptManagedGlobalVar.findIndex((key) => key === action.payload.key) >= 0;
      state.globalGameVar[action.payload.key] = action.payload.value;
      if (!isRegistedInUserData) {
        state.scriptManagedGlobalVar.push(action.payload.key);
      }
    },
    setSlPage: (state, action: PayloadAction<number>) => {
      state.optionData.slPage = action.payload;
    },
    resetOptionSet(state) {
      Object.assign(state.optionData, initialOptionSet);
    },
    resetAllData(state) {
      Object.assign(state, cloneDeep(initState));
    },
  },
});

export const {
  setUserData,
  resetUserData,
  setOptionData,
  setGlobalVar,
  setScriptManagedGlobalVar,
  setSlPage,
  unlockCgInUserData,
  unlockBgmInUserData,
  resetOptionSet,
  resetAllData,
} = userDataSlice.actions;
export default userDataSlice.reducer;