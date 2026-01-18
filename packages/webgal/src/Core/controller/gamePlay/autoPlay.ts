import styles from '@/UI/BottomControlPanel/bottomControlPanel.module.scss';
import { webgalStore } from '@/store/store';
import { nextSentence } from '@/Core/controller/gamePlay/nextSentence';
import { WebGAL } from '@/Core/WebGAL';

/**
 * 设置 autoplay 按钮的激活与否
 */
const setButton = (on: boolean) => {
  const autoIcon = document.getElementById('Button_ControlPanel_auto');
  if (autoIcon) {
    if (on) {
      autoIcon.className = styles.button_on;
    } else autoIcon.className = styles.singleButton;
  }
};

/**
 * 停止自动播放
 */
export const stopAuto = () => {
  WebGAL.gameplay.isAuto = false;
  setButton(false);
  if (WebGAL.gameplay.autoInterval !== null) {
    clearInterval(WebGAL.gameplay.autoInterval);
    WebGAL.gameplay.autoInterval = null;
  }
  if (WebGAL.gameplay.autoTimeout !== null) {
    clearTimeout(WebGAL.gameplay.autoTimeout);
    WebGAL.gameplay.autoTimeout = null;
  }
};

/**
 * 切换自动播放状态
 */
export const switchAuto = () => {
  if (WebGAL.gameplay.isAuto) {
    stopAuto();
  } else {
    WebGAL.gameplay.isAuto = true;
    setButton(true);
    WebGAL.gameplay.autoInterval = setInterval(autoPlay, 100);
  }
};

export const autoNextSentence = () => {
  nextSentence();
  WebGAL.gameplay.autoTimeout = null;
};

/**
 * 自动播放的执行函数
 */
const autoPlay = () => {
  const data = webgalStore.getState().userData.optionData.autoSpeed;
  const stageState = webgalStore.getState().stage;

  // 范围约 [100, 1600]
  let autoPlayDelay = 100 + (100 - data) * 15;

  if (stageState.judgment === 'begins' && stageState.isJudgmentFastForward) {
    autoPlayDelay = 200;
  }

  let isBlockingAuto = false;
  WebGAL.gameplay.performController.performList.forEach((e) => {
    if (e.blockingAuto()) isBlockingAuto = true;
  });
  if (isBlockingAuto) {
    return;
  }
  if (WebGAL.gameplay.autoTimeout === null) {
    WebGAL.gameplay.autoTimeout = setTimeout(autoNextSentence, autoPlayDelay);
  }
};