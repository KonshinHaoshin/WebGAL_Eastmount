import React from 'react';
import styles from '@/Core/gameScripts/thinking/thinking.module.scss';
import { webgalStore } from '@/store/store';
import { textFont } from '@/store/userDataInterface';
import { useSEByWebgalStore } from '@/hooks/useSoundEffect';
import useApplyStyle from '@/hooks/useApplyStyle';
import messageBubble from '@/assets/dragonspring/thinking/messageBubble.png';
import messageBubbleHover from '@/assets/dragonspring/thinking/messageBubble_hover.png';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';
import { jmp } from '@/Core/gameScripts/label/jmp';
import { playVideo } from '@/Core/gameScripts/playVideo';
import { setStage } from '@/store/stageReducer';
import { stopAuto } from '@/Core/controller/gamePlay/autoPlay';

export interface IThinkingOption {
  characterImage: string;
  options: Array<{
    text: string;
    scene: string;
    buttonIcon?: string;
    refuteVideo?: string;
  }>;
}

export const ThinkingMenu: React.FC<{ thinkingOption: IThinkingOption }> = ({ thinkingOption }) => {
  const fontFamily = webgalStore.getState().userData.optionData.textboxFont;
  const font = fontFamily === textFont.song ? '"思源宋体", serif' : '"WebgalUI", serif';
  const { playSeEnter, playSeClick } = useSEByWebgalStore();
  const applyStyle = useApplyStyle('');

  const characterImagePath = `./game/thinking/${thinkingOption.characterImage}`;

  return (
    <div className={applyStyle('Thinking_Main', styles.Thinking_Main)}>
      <div className={applyStyle('Thinking_Overlay', styles.Thinking_Overlay)} />

      <div className={applyStyle('Thinking_Character', styles.Thinking_Character)}>
        <img
          src={characterImagePath}
          alt="character"
          className={applyStyle('Thinking_Character_Image', styles.Thinking_Character_Image)}
        />
      </div>

      <div className={applyStyle('Thinking_Options', styles.Thinking_Options)}>
        {thinkingOption.options.map((option, index) => {
          const isBack = option.scene === '@back';
          const onClick = async () => {
            playSeClick();
            // @ts-ignore
            window.WebGAL?.gameplay.performController.unmountPerform('thinking');
            if (isBack) return;

            const targetStr = option.scene.trim();

            const executeJump = async () => {
              // @ts-ignore
              if (window.WebGAL) window.WebGAL.sceneManager.lockSceneWrite = false;
              
              if (targetStr.includes('.')) {
                const { changeScene } = await import('@/Core/controller/scene/changeScene');
                const sceneUrl = targetStr.startsWith('./') ? targetStr : assetSetter(targetStr, fileType.scene);
                changeScene(sceneUrl, targetStr);
              } else if (targetStr !== '') {
                jmp(targetStr);
              }
            };

            if (option.refuteVideo) {
              const dispatch = webgalStore.dispatch;
              const stageState = webgalStore.getState().stage;

              if (stageState.judgment !== '') {
                dispatch(setStage({ key: 'judgment', value: '' }));
                dispatch(setStage({ key: 'isJudgmentFastForward', value: false }));
                // @ts-ignore
                if (window.WebGAL?.gameplay.isAuto) {
                  stopAuto();
                }
              }

              const videoPath = assetSetter(option.refuteVideo, fileType.figure);
              const perform = playVideo({
                command: 0 as any,
                commandRaw: '',
                args: [
                  { key: 'noSkip', value: true },
                  { key: 'skipOff', value: true },
                ],
                content: videoPath,
                sentenceAssets: [],
                subScene: [],
              });

              if (perform.arrangePerformPromise) {
                perform.arrangePerformPromise.then((p) => {
                  // @ts-ignore
                  window.WebGAL?.gameplay.performController.performList.push(p);
                  const originalStop = p.stopFunction;
                  p.goNextWhenOver = false;
                  p.stopFunction = () => {
                    originalStop();
                    executeJump();
                  };
                });
              }
            } else {
              executeJump();
            }
          };

          return (
            <div key={index} className={applyStyle('Thinking_Option_Container', styles.Thinking_Option_Container)}>
              {option.buttonIcon && (
                <div className={applyStyle('Thinking_Button_Icon', styles.Thinking_Button_Icon)}>
                  <img src={`./game/thinking_button/${option.buttonIcon}`} alt="button icon" />
                </div>
              )}

              <div
                className={`${applyStyle('Thinking_Bubble', styles.Thinking_Bubble)} ${
                  isBack ? applyStyle('Thinking_Back', styles.Thinking_Back) : ''
                }`}
                onClick={onClick}
                onMouseEnter={playSeEnter}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundImage = `url(${messageBubbleHover})`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundImage = `url(${messageBubble})`;
                }}
                style={{
                  backgroundImage: `url(${messageBubble})`,
                  fontFamily: font,
                }}
              >
                {option.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


