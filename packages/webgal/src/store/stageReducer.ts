/**
 * 所有会被Save和Backlog记录下的信息，构成当前的舞台状态（也包含游戏运行时变量）
 * 舞台状态是演出结束后的“终态”，在读档时不发生演出，只是将舞台状态替换为读取的状态。
 */

import {
  baseTransform,
  IEffect,
  IFigureMetadata,
  IFreeFigure,
  ILive2DBlink,
  ILive2DExpression,
  ILive2DFocus,
  ILive2DMotion,
  IModifyInventoryItemPayload,
  IRunPerform,
  ISetGameVar,
  ISetStagePayload,
  IStageState,
  IUpdateAnimationSettingPayload,
} from '@/store/stageInterface';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import cloneDeep from 'lodash/cloneDeep';
import { commandType } from '@/Core/controller/scene/sceneInterface';
import { STAGE_KEYS } from '@/Core/constants';

// 初始化舞台数据
export const initState: IStageState = {
  oldBgName: '',
  bgName: '',
  figName: '',
  figNameLeft: '',
  figNameRight: '',
  freeFigure: [],
  figureAssociatedAnimation: [],
  showText: '',
  showTextSize: -1,
  showName: '',
  command: '',
  choose: [],
  vocal: '',
  playVocal: '',
  vocalVolume: 100,
  bgm: {
    src: '',
    enter: 0,
    volume: 100,
  },
  uiSe: '',
  miniAvatar: '',
  GameVar: {},
  effects: [
    {
      target: 'stage-main',
      transform: baseTransform,
    },
  ],
  animationSettings: [],
  bgFilter: '',
  bgTransform: '',
  bgLut: '',
  PerformList: [],
  currentDialogKey: 'initial',
  live2dMotion: [],
  live2dExpression: [],
  live2dBlink: [],
  live2dFocus: [],
  currentConcatDialogPrev: '',
  enableFilm: '',
  judgment: '',
  judgmentTimer: 0,
  judgmentTimeout: '',
  isJudgmentFastForward: false,
  isDisableTextbox: false,
  replacedUIlable: {},
  figureMetaData: {},
  enableManopedia: false,
  inventory: {
    items: {},
  },
  viewingItemId: null,
  viewingItemCount: 1,
  isEvidenceMode: false,
  evidenceTarget: '',
  evidenceJumpScenes: [],
  showManopedia: false,
  testimonyData: [],
  inlineThinking: null,
};

/**
 * 创建舞台的状态管理
 */
const stageSlice = createSlice({
  name: 'stage',
  initialState: cloneDeep(initState),
  reducers: {
    resetStageState: (state, action: PayloadAction<IStageState>) => {
      Object.assign(state, action.payload);
    },
    setStage: (state, action: PayloadAction<ISetStagePayload>) => {
      // @ts-ignore
      state[action.payload.key] = action.payload.value;
    },
    setStageVar: (state, action: PayloadAction<ISetGameVar>) => {
      state.GameVar[action.payload.key] = action.payload.value;
    },
    updateEffect: (state, action: PayloadAction<IEffect>) => {
      const { target, transform } = action.payload;
      const activeTargets = [
        STAGE_KEYS.STAGE_MAIN,
        STAGE_KEYS.BGMAIN,
        STAGE_KEYS.FIG_C,
        STAGE_KEYS.FIG_L,
        STAGE_KEYS.FIG_R,
        ...state.freeFigure.map((figure) => figure.key),
      ];
      const isItemKey = target.startsWith('item-');
      if (!activeTargets.includes(target) && !isItemKey) return;

      const effectIndex = state.effects.findIndex((e) => e.target === target);
      if (effectIndex >= 0) {
        state.effects[effectIndex].transform = transform;
      } else {
        state.effects.push({
          target,
          transform,
        });
      }
    },
    removeEffectByTargetId: (state, action: PayloadAction<string>) => {
      const index = state.effects.findIndex((e) => e.target === action.payload);
      if (index >= 0) {
        state.effects.splice(index, 1);
      }
    },
    updateAnimationSettings: (state, action: PayloadAction<IUpdateAnimationSettingPayload>) => {
      const { target, key, value } = action.payload;
      const animationIndex = state.animationSettings.findIndex((a) => a.target === target);
      if (animationIndex >= 0) {
        state.animationSettings[animationIndex] = {
          ...state.animationSettings[animationIndex],
          [key]: value,
        };
      } else {
        state.animationSettings.push({
          target,
          [key]: value,
        });
      }
    },
    removeAnimationSettingsByTarget: (state, action: PayloadAction<string>) => {
      const index = state.animationSettings.findIndex((a) => a.target === action.payload);
      if (index >= 0) {
        state.animationSettings.splice(index, 1);
      }
    },
    addPerform: (state, action: PayloadAction<IRunPerform>) => {
      const dupPerformIndex = state.PerformList.findIndex((p) => p.id === action.payload.id);
      if (dupPerformIndex > -1) {
        const dupId = action.payload.id;
        for (let i = 0; i < state.PerformList.length; i++) {
          const performItem: IRunPerform = state.PerformList[i];
          if (performItem.id === dupId) {
            state.PerformList.splice(i, 1);
            i--;
          }
        }
      }
      state.PerformList.push(action.payload);
    },
    removePerformByName: (state, action: PayloadAction<string>) => {
      for (let i = 0; i < state.PerformList.length; i++) {
        const performItem: IRunPerform = state.PerformList[i];
        if (performItem.id === action.payload) {
          state.PerformList.splice(i, 1);
          i--;
        }
      }
    },
    removeAllPerform: (state) => {
      state.PerformList.splice(0, state.PerformList.length);
    },
    removeAllPixiPerforms: (state) => {
      for (let i = 0; i < state.PerformList.length; i++) {
        const performItem: IRunPerform = state.PerformList[i];
        if (performItem.script.command === commandType.pixi) {
          state.PerformList.splice(i, 1);
          i--;
        }
      }
    },
    setFreeFigureByKey: (state, action: PayloadAction<IFreeFigure>) => {
      const currentFreeFigures = state.freeFigure;
      const newFigure = action.payload;
      const index = currentFreeFigures.findIndex((figure) => figure.key === newFigure.key);
      if (index >= 0) {
        if (newFigure.name === '') {
          currentFreeFigures.splice(index, 1);
          const figureAssociatedAnimationIndex = state.figureAssociatedAnimation.findIndex(
            (a) => a.targetId === newFigure.key,
          );
          state.figureAssociatedAnimation.splice(figureAssociatedAnimationIndex, 1);
        } else {
          currentFreeFigures[index].basePosition = newFigure.basePosition;
          currentFreeFigures[index].name = newFigure.name;
        }
      } else {
        if (newFigure.name !== '') currentFreeFigures.push(newFigure);
      }
    },
    setFreeFigure: (state, action: PayloadAction<IFreeFigure[]>) => {
      state.freeFigure = action.payload;
    },
    setLive2dMotion: (state, action: PayloadAction<ILive2DMotion>) => {
      const { target, motion, overrideBounds } = action.payload;
      const index = state.live2dMotion.findIndex((e) => e.target === target);
      if (index < 0) {
        state.live2dMotion.push({ target, motion, overrideBounds });
      } else {
        state.live2dMotion[index].motion = motion;
        state.live2dMotion[index].overrideBounds = overrideBounds;
      }
    },
    setLive2dExpression: (state, action: PayloadAction<ILive2DExpression>) => {
      const { target, expression } = action.payload;
      const index = state.live2dExpression.findIndex((e) => e.target === target);
      if (index < 0) {
        state.live2dExpression.push({ target, expression });
      } else {
        state.live2dExpression[index].expression = expression;
      }
    },
    setLive2dBlink: (state, action: PayloadAction<ILive2DBlink>) => {
      const { target, blink } = action.payload;
      const index = state.live2dBlink.findIndex((e) => e.target === target);
      if (index < 0) {
        state.live2dBlink.push({ target, blink });
      } else {
        state.live2dBlink[index].blink = blink;
      }
    },
    setLive2dFocus: (state, action: PayloadAction<ILive2DFocus>) => {
      const { target, focus } = action.payload;
      const index = state.live2dFocus.findIndex((e) => e.target === target);
      if (index < 0) {
        state.live2dFocus.push({ target, focus });
      } else {
        state.live2dFocus[index].focus = focus;
      }
    },
    replaceUIlable: (state, action: PayloadAction<[string, string]>) => {
      state.replacedUIlable[action.payload[0]] = action.payload[1];
    },
    setFigureMetaData: (state, action: PayloadAction<[string, keyof IFigureMetadata, any, undefined | boolean]>) => {
      if (action.payload[3]) {
        if (state.figureMetaData[action.payload[0]]) delete state.figureMetaData[action.payload[0]];
      } else {
        if (!state.figureMetaData[action.payload[0]]) {
          state.figureMetaData[action.payload[0]] = {};
        }
        state.figureMetaData[action.payload[0]][action.payload[1]] = action.payload[2];
      }
    },
    addInventoryItem: (state, action: PayloadAction<IModifyInventoryItemPayload>) => {
      const { itemId, count, name } = action.payload;
      if (!state.inventory.items[itemId]) {
        if (!name) {
          return;
        }
        state.inventory.items[itemId] = {
          id: itemId,
          name: name,
          count: 0,
        };
      }
      state.inventory.items[itemId].count = Math.max(0, state.inventory.items[itemId].count + count);
      if (state.inventory.items[itemId].count === 0) {
        delete state.inventory.items[itemId];
      }
    },
    setViewingItemId: (state, action: PayloadAction<{ itemId: string | null; count?: number }>) => {
      state.viewingItemId = action.payload.itemId;
      if (action.payload.count !== undefined) {
        state.viewingItemCount = action.payload.count;
      } else if (action.payload.itemId === null) {
        state.viewingItemCount = 1;
      }
    },
    clearAllItems: (state) => {
      state.inventory.items = {};
      state.viewingItemId = null;
      state.viewingItemCount = 1;
    },
  },
});

export const {
  resetStageState,
  setStage,
  setStageVar,
  setFreeFigure,
  addInventoryItem,
  clearAllItems,
  updateAnimationSettings,
  removeAnimationSettingsByTarget,
  setViewingItemId,
} = stageSlice.actions;
export const stageActions = stageSlice.actions;
export default stageSlice.reducer;