import React, { FC } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';
import styles from '@/Core/gameScripts/thinking/thinking.module.scss';
import messageBubble from '@/assets/dragonspring/thinking/messageBubble.png';
import messageBubbleHover from '@/assets/dragonspring/thinking/messageBubble_hover.png';
import { useSEByWebgalStore } from '@/hooks/useSoundEffect';
import { changeScene } from '@/Core/controller/scene/changeScene';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';
import { jmp } from '@/Core/gameScripts/label/jmp';
import { WebGAL } from '@/Core/WebGAL';
import { switchAuto } from '@/Core/controller/gamePlay/autoPlay';
import { WebgalParser } from '@/Core/parser/sceneParser';
import { runScript } from '@/Core/controller/gamePlay/runScript';

export const InlineThinkingOverlay: FC = () => {
  const dispatch = useDispatch();
  const inlineThinking = useSelector((state: RootState) => state.stage.inlineThinking);
  const { playSeEnter, playSeClick } = useSEByWebgalStore();

  if (!inlineThinking) return null;

  const handleClose = () => {
    dispatch(setStage({ key: 'inlineThinking', value: null }));
    // 恢复自动播放，因为 judgment 模式要求强制自动播放
    if (webgalStore.getState().stage.judgment !== '' && !WebGAL.gameplay.isAuto) {
      switchAuto();
    }
  };

  const handleOptionClick = (target: string) => {
    playSeClick();
    if (target === '@back') {
      handleClose();
      return;
    }

    const targetStr = target.toString().trim();

    // 如果目标包含冒号，则作为指令执行
    if (targetStr.includes(':')) {
      handleClose();
      // 使用 WebgalParser 解析指令
      const parsedScene = WebgalParser.parse(targetStr, 'inline_cmd', '');
      if (parsedScene.sentenceList.length > 0) {
        // 执行解析出的第一条指令（如 refute 指令）
        runScript(parsedScene.sentenceList[0]);
      }
      return;
    }

    // 执行正常的跳转逻辑，跳转前关闭菜单
    handleClose();

    // 因为这里决定要执行跳转（如反驳成功），所以我们需要清理证言状态
    dispatch(setStage({ key: 'testimonyData', value: [] }));
    dispatch(setStage({ key: 'isJudgmentFastForward', value: false }));

    const isScene = targetStr.endsWith('.txt');

    if (isScene) {
      const sceneUrl = assetSetter(targetStr, fileType.scene);
      WebGAL.sceneManager.lockSceneWrite = false;
      setTimeout(() => {
        changeScene(sceneUrl, targetStr);
      }, 0);
    } else {
      WebGAL.sceneManager.lockSceneWrite = false;
      setTimeout(() => {
        jmp(targetStr);
      }, 0);
    }
  };

  return (
    <div className={styles.Thinking_Main} style={{ zIndex: 2000 }}>
      {/* 遮罩层，点击关闭 */}
      <div className={styles.Thinking_Overlay} style={{ pointerEvents: 'auto' }} onClick={handleClose} />

      {/* 角色立绘 */}
      <div className={styles.Thinking_Character}>
        <img
          src={`./game/thinking/${inlineThinking.avatar}`}
          alt="character"
          className={styles.Thinking_Character_Image}
        />
      </div>

      {/* 选项气泡 */}
      <div className={styles.Thinking_Options}>
        {inlineThinking.options.map((option, index) => (
          <div key={index} className={styles.Thinking_Option_Container}>
            {/* 按钮图标（如果有） */}
            {option.icon && (
              <div className={styles.Thinking_Button_Icon}>
                <img src={`./game/thinking_button/${option.icon}`} alt="button icon" />
              </div>
            )}
            <div
              className={`${styles.Thinking_Bubble} ${option.target === '@back' ? styles.Thinking_Back : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleOptionClick(option.target);
              }}
              onMouseEnter={playSeEnter}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundImage = `url(${messageBubbleHover})`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundImage = `url(${messageBubble})`;
              }}
              style={{
                backgroundImage: `url(${messageBubble})`,
                fontFamily: '"WebgalUI", serif',
              }}
            >
              {option.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
