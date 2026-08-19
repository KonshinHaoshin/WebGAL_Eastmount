import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import GUIReducer from '@/store/GUIReducer';
import userDataReducer from '@/store/userDataReducer';
import savesReducer from '@/store/savesReducer';
import stageReducer, { addInventoryItem, clearAllItems, resetStageState, setStage, stageActions } from '@/store/stageReducer';
import { stageStateManager } from '@/Core/Modules/stage/stageStateManager';

/**
 * WebGAL 全局状态管理
 */
export const webgalStore = configureStore({
  reducer: {
    GUI: GUIReducer,
    userData: userDataReducer,
    saveData: savesReducer,
    stage: stageReducer,
  },
  middleware: getDefaultMiddleware({ serializableCheck: false }).concat(() => (next) => (action) => {
    if (setStage.match(action)) stageStateManager.setStage(action.payload.key, action.payload.value as never);
    else if (addInventoryItem.match(action)) stageStateManager.addInventoryItem(action.payload);
    else if (clearAllItems.match(action)) stageStateManager.clearAllItems();
    else if (stageActions.setViewingItemId.match(action)) {
      stageStateManager.setStage('viewingItemId', action.payload.itemId);
      if (action.payload.count !== undefined) stageStateManager.setStage('viewingItemCount', action.payload.count);
      else if (action.payload.itemId === null) stageStateManager.setStage('viewingItemCount', 1);
    } else if (stageActions.setFigureMetaData.match(action)) stageStateManager.setFigureMetaData(action.payload);
    else if (stageActions.updateEffect.match(action)) stageStateManager.updateEffect(action.payload);
    return next(action);
  }),
  devTools: process.env.NODE_ENV !== 'production',
});

// 在 TS 中的类型声明
export type RootState = ReturnType<typeof webgalStore.getState>;

stageStateManager.subscribe((stageState) => {
  webgalStore.dispatch(resetStageState(stageState));
});
