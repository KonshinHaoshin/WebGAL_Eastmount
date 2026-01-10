import React, { FC, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';
import { changeScene } from '@/Core/controller/scene/changeScene';
import { stopAuto } from '@/Core/controller/gamePlay/autoPlay';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';
import { WebGAL } from '@/Core/WebGAL';
import fastForward from '@/assets/dragonspring/judgment/fast-forward.png';
import fastForwardON from '@/assets/dragonspring/judgment/fast-forward-on.png';
import timerBg from '@/assets/dragonspring/judgment/timer.png';
import styles from './timer.module.scss';

export const Timer: FC = () => {
  const dispatch = useDispatch();
  const judgment = useSelector((state: RootState) => state.stage.judgment);
  const judgmentTimer = useSelector((state: RootState) => state.stage.judgmentTimer);
  const judgmentTimeout = useSelector((state: RootState) => state.stage.judgmentTimeout);
  const isFastForward = useSelector((state: RootState) => state.stage.isJudgmentFastForward);
  const isDisableTextbox = useSelector((state: RootState) => state.stage.isDisableTextbox);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (judgment === 'begins' && judgmentTimer > 0 && isDisableTextbox) {
      let lastUpdate = Date.now();
      const step = 16; // ~60fps update interval for smoothness
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        lastUpdate = now;

        const speedMultiplier = isFastForward ? 5 : 1;
        const decrement = delta * speedMultiplier;

        const currentTimer = webgalStore.getState().stage.judgmentTimer;
        const nextTimer = Math.max(0, currentTimer - decrement);

        dispatch(setStage({ key: 'judgmentTimer', value: nextTimer }));

        if (nextTimer === 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Timeout reached
          if (judgmentTimeout) {
            dispatch(setStage({ key: 'isJudgmentFastForward', value: false }));
            dispatch(setStage({ key: 'judgment', value: '' }));
            // 超时也自动解除 auto 模式
            stopAuto();
            const sceneName = judgmentTimeout.toString();
            const sceneUrl = assetSetter(sceneName, fileType.scene);

            // 确保引擎状态干净
            WebGAL.sceneManager.lockSceneWrite = false;

            // 确保在下一帧执行场景切换，避免冲突
            setTimeout(() => {
              changeScene(sceneUrl, sceneName);
            }, 0);
          }
        }
      }, step);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [judgment, judgmentTimeout, isFastForward, isDisableTextbox, dispatch]);

  if (judgment !== 'begins' || !isDisableTextbox) {
    return null;
  }

  const handleMouseDown = () => {
    dispatch(setStage({ key: 'isJudgmentFastForward', value: true }));
  };

  const handleMouseUp = () => {
    dispatch(setStage({ key: 'isJudgmentFastForward', value: false }));
  };

  const renderTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;

    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds
      .toString()
      .padStart(3, '0')}`;

    return timeStr.split('').map((char, index) => (
      <span key={index} className={char === ':' ? styles.separator : styles.digit}>
        {char}
      </span>
    ));
  };

  return (
    <div className={styles.timerContainer}>
      <div
        className={styles.fastForwardBtn}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img src={isFastForward ? fastForwardON : fastForward} alt="fast forward" />
      </div>
      <div className={styles.timerDisplay} style={{ backgroundImage: `url(${timerBg})` }}>
        <div className={styles.timerValue}>{renderTime(judgmentTimer)}</div>
      </div>
    </div>
  );
};
