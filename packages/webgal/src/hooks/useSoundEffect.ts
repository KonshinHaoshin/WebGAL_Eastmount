import { setStage } from '@/store/stageReducer';

import page_flip_1 from '@/assets/se/page-flip-1.mp3';
import switch_1 from '@/assets/se/switch-1.mp3';
import mouse_enter from '@/assets/se/mouse-enter.mp3';
import dialog_se from '@/assets/se/dialog.mp3';
import click_se from '@/assets/se/click.mp3';
import open_media from '@/assets/dragonspring/ogg/open_media.ogg';
import open_gearbutton from '@/assets/dragonspring/ogg/open_gearbutton.ogg';
import close_pedia from '@/assets/dragonspring/ogg/close_pedia.ogg';
import close_gearbutton from '@/assets/dragonspring/ogg/close_gearbutton.ogg';
import choose_se from '@/assets/dragonspring/ogg/choose.ogg';
import pedia_choose from '@/assets/dragonspring/ogg/pedia_choose.ogg';
import right_click from '@/assets/dragonspring/ogg/right_click.ogg';
import { useDispatch } from 'react-redux';
import { webgalStore } from '@/store/store';

/**
 * 调用音效
 */
const useSoundEffect = () => {
  const dispatch = useDispatch();

  const playSeEnter = () => {
    // 禁用鼠标悬停音效
    // dispatch(setStage({ key: 'uiSe', value: mouse_enter }));
  };
  const playSeClick = () => {
    dispatch(setStage({ key: 'uiSe', value: choose_se }));
  };
  const playSeRightClick = () => {
    webgalStore.dispatch(setStage({ key: 'uiSe', value: right_click }));
  };
  const playSeCancel = () => {
    webgalStore.dispatch(setStage({ key: 'uiSe', value: right_click }));
  };
  const playSeManopedia = () => {
    webgalStore.dispatch(setStage({ key: 'uiSe', value: open_media }));
  };
  const playSeGear = () => {
    webgalStore.dispatch(setStage({ key: 'uiSe', value: open_gearbutton }));
  };
  const playSeCloseGear = () => {
    webgalStore.dispatch(setStage({ key: 'uiSe', value: close_gearbutton }));
  };
  const playSeCloseManopedia = () => {
    webgalStore.dispatch(setStage({ key: 'uiSe', value: close_pedia }));
  };
  const playSePediaChoose = () => {
    webgalStore.dispatch(setStage({ key: 'uiSe', value: pedia_choose }));
  };
  const playSeSwitch = () => {
    // 禁用开关/切换音效
    // dispatch(setStage({ key: 'uiSe', value: switch_1 }));
  };
  const playSePageChange = () => {
    // 禁用翻页音效
    // dispatch(setStage({ key: 'uiSe', value: page_flip_1 }));
  };

  const playSeDialogOpen = () => {
    // 禁用对话框打开音效
    // dispatch(setStage({ key: 'uiSe', value: dialog_se }));
  };

  return {
    playSeEnter,
    playSeClick,
    playSeRightClick,
    playSeCancel,
    playSeManopedia,
    playSeGear,
    playSeCloseGear,
    playSeCloseManopedia,
    playSePediaChoose,
    playSePageChange,
    playSeDialogOpen,
    playSeSwitch,
  };
};

/**
 * 调用音效（只供 choose.tsx 使用）
 */
export const useSEByWebgalStore = () => {
  const playSeEnter = () => {
    // 禁用鼠标悬停音效
    // webgalStore.dispatch(setStage({ key: 'uiSe', value: mouse_enter }));
  };
  const playSeClick = () => {
    webgalStore.dispatch(setStage({ key: 'uiSe', value: choose_se }));
  };
  const playSeRightClick = () => {
    webgalStore.dispatch(setStage({ key: 'uiSe', value: right_click }));
  };
  const playSeCancel = () => {
    webgalStore.dispatch(setStage({ key: 'uiSe', value: right_click }));
  };
  return {
    playSeEnter, // 鼠标进入
    playSeClick, // 鼠标点击
    playSeRightClick, // 鼠标右键
    playSeCancel, // 取消
  };
};

export default useSoundEffect;
