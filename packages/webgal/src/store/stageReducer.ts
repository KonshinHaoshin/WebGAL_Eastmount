import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import cloneDeep from 'lodash/cloneDeep';
import type { IEffect, IFigureMetadata, IModifyInventoryItemPayload, IStageState } from '@/Core/Modules/stage/stageInterface';
import { initState } from '@/Core/Modules/stage/stageStateManager';

export interface ISetStagePayload<K extends keyof IStageState = keyof IStageState> {
  key: K;
  value: IStageState[K];
}

const stageSlice = createSlice({
  name: 'stage',
  initialState: cloneDeep(initState),
  reducers: {
    resetStageState: (_state, action: PayloadAction<IStageState>) => cloneDeep(action.payload),
    setStage: (state, action: PayloadAction<ISetStagePayload>) => {
      (state as any)[action.payload.key] = action.payload.value;
    },
    addInventoryItem: (state, action: PayloadAction<IModifyInventoryItemPayload>) => {
      const { itemId, count, name } = action.payload;
      if (!state.inventory.items[itemId]) {
        if (!name) return;
        state.inventory.items[itemId] = { id: itemId, name, count: 0 };
      }
      state.inventory.items[itemId].count = Math.max(0, state.inventory.items[itemId].count + count);
      if (state.inventory.items[itemId].count === 0) delete state.inventory.items[itemId];
    },
    clearAllItems: (state) => {
      state.inventory.items = {};
      state.viewingItemId = null;
      state.viewingItemCount = 1;
    },
    setViewingItemId: (state, action: PayloadAction<{ itemId: string | null; count?: number }>) => {
      state.viewingItemId = action.payload.itemId;
      state.viewingItemCount = action.payload.count ?? (action.payload.itemId === null ? 1 : state.viewingItemCount);
    },
    setFigureMetaData: (state, action: PayloadAction<[string, keyof IFigureMetadata, any, undefined | boolean]>) => {
      const [target, key, value, reset] = action.payload;
      if (reset) delete state.figureMetaData[target];
      else state.figureMetaData[target] = { ...state.figureMetaData[target], [key]: value };
    },
    updateEffect: (state, action: PayloadAction<IEffect>) => {
      const index = state.effects.findIndex((effect) => effect.target === action.payload.target);
      if (index >= 0) state.effects[index] = action.payload;
      else state.effects.push(action.payload);
    },
  },
});

export const { resetStageState, setStage, addInventoryItem, clearAllItems } = stageSlice.actions;
export const stageActions = stageSlice.actions;
export default stageSlice.reducer;
