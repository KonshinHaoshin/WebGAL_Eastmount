import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import ReactDOM from 'react-dom';
import React from 'react';
import styles from './thinking.module.scss';
import { webgalStore } from '@/store/store';
import { textFont } from '@/store/userDataInterface';
import { PerformController } from '@/Core/Modules/perform/performController';
import { useSEByWebgalStore } from '@/hooks/useSoundEffect';
import { WebGAL } from '@/Core/WebGAL';
import { whenChecker } from '@/Core/controller/gamePlay/scriptExecutor';
import useEscape from '@/hooks/useEscape';
import useApplyStyle from '@/hooks/useApplyStyle';
import { Provider } from 'react-redux';
import messageBubble from '@/assets/dragonspring/thinking/messageBubble.png';
import messageBubbleHover from '@/assets/dragonspring/thinking/messageBubble_hover.png';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';
import { playVideo } from '@/Core/gameScripts/playVideo';
import { setStage } from '@/store/stageReducer';
import { stopAuto } from '@/Core/controller/gamePlay/autoPlay';

class ThinkingOption {
  /**
   * 解析 thinking 选项
   * 格式：thinking:立绘路径 选项文本:跳转场景@按钮图标|选项文本:跳转场景@按钮图标;
   * 示例：thinking:ema/ema.png 我反对！:1.txt@objection.png|我觉得没问题:2.txt;
   */
  public static parse(script: string): ThinkingOption {
    // 首先分离立绘路径和选项部分
    const parts = script.split(' ');
    if (parts.length < 2) {
      throw new Error('Invalid thinking format');
    }

    const characterImage = parts[0]; // 立绘路径，如 ema/ema.png
    const optionsPart = parts.slice(1).join(' ');

    // 解析选项
    const optionParts = optionsPart.split(/(?<!\\)\|/);
    const options = optionParts.map((option) => {
      const trimmedOption = option.trim();
      if (trimmedOption === '@back') {
        return {
          text: '返回',
          scene: '@back',
          buttonIcon: undefined,
        };
      }
      const optionMatch = trimmedOption.match(/^(.*?):(.*?)(?:@(.*))?$/);
      if (!optionMatch) {
        throw new Error(`Invalid thinking option format: ${option}`);
      }

      const [, text, scene, argsPart] = optionMatch;
      let buttonIcon: string | undefined;
      let refuteVideo: string | undefined;
      if (argsPart) {
        const args = argsPart.split('@');
        args.forEach((arg) => {
          const trimmedArg = arg.trim();
          if (trimmedArg.startsWith('icon=')) {
            buttonIcon = trimmedArg.substring(5).trim();
          } else if (trimmedArg.startsWith('refute=')) {
            refuteVideo = trimmedArg.substring(7).trim();
          } else if (!buttonIcon) {
            buttonIcon = trimmedArg;
          }
        });
      }
      return {
        text: useEscape(text.trim()),
        scene: scene.trim(),
        buttonIcon: buttonIcon,
        refuteVideo: refuteVideo,
      };
    });

    return new ThinkingOption(characterImage, options);
  }

  public characterImage: string;
  public options: Array<{
    text: string;
    scene: string;
    buttonIcon?: string;
    refuteVideo?: string;
  }>;

  public constructor(
    characterImage: string,
    options: Array<{ text: string; scene: string; buttonIcon?: string; refuteVideo?: string }>,
  ) {
    this.characterImage = characterImage;
    this.options = options;
  }
}

/**
 * 显示思考选择
 * @param sentence
 */
export const thinking = (sentence: ISentence): IPerform => {
  const thinkingOption = ThinkingOption.parse(sentence.content);

  // eslint-disable-next-line react/no-deprecated
  ReactDOM.render(
    <Provider store={webgalStore}>
      <Thinking thinkingOption={thinkingOption} />
    </Provider>,
    document.getElementById('thinkingContainer'),
  );

  return {
    performName: 'thinking',
    duration: 1000 * 60 * 60 * 24,
    isHoldOn: false,
    stopFunction: () => {
      // eslint-disable-next-line react/no-deprecated
      ReactDOM.render(<div />, document.getElementById('thinkingContainer'));
    },
    blockingNext: () => true,
    blockingAuto: () => true,
    stopTimeout: undefined,
  };
};

function Thinking(props: { thinkingOption: ThinkingOption }) {
  const fontFamily = webgalStore.getState().userData.optionData.textboxFont;
  const font = fontFamily === textFont.song ? '"思源宋体", serif' : '"WebgalUI", serif';
  const { playSeEnter, playSeClick } = useSEByWebgalStore();
  const applyStyle = useApplyStyle('Stage/Thinking/thinking.scss');

  // 获取立绘的完整路径 - thinking 语句使用特殊的路径
  const characterImagePath = `./game/thinking/${props.thinkingOption.characterImage}`;

  return (
    <div className={applyStyle('Thinking_Main', styles.Thinking_Main)}>
      {/* 遮罩层 */}
      <div className={applyStyle('Thinking_Overlay', styles.Thinking_Overlay)} />

      {/* 角色立绘 */}
      <div className={applyStyle('Thinking_Character', styles.Thinking_Character)}>
        <img
          src={characterImagePath}
          alt="character"
          className={applyStyle('Thinking_Character_Image', styles.Thinking_Character_Image)}
        />
      </div>

      {/* 选项气泡 */}
      <div className={applyStyle('Thinking_Options', styles.Thinking_Options)}>
        {props.thinkingOption.options.map((option, index) => {
          const isBack = option.scene === '@back';
          const onClick = async () => {
            playSeClick();
            WebGAL.gameplay.performController.unmountPerform('thinking');
            if (isBack) return;

            const executeJump = async () => {
              WebGAL.sceneManager.lockSceneWrite = false;
              if (option.scene.endsWith('.txt')) {
                const { changeScene } = await import('@/Core/controller/scene/changeScene');
                const sceneUrl = assetSetter(option.scene, fileType.scene);
                changeScene(sceneUrl, option.text);
              } else if (option.scene !== '') {
                const { jmp } = await import('@/Core/gameScripts/label/jmp');
                jmp(option.scene);
              }
            };

            if (option.refuteVideo) {
              const dispatch = webgalStore.dispatch;
              const stageState = webgalStore.getState().stage;

              // 如果正在审判模式，先停止
              if (stageState.judgment !== '') {
                dispatch(setStage({ key: 'judgment', value: '' }));
                dispatch(setStage({ key: 'isJudgmentFastForward', value: false }));
                if (WebGAL.gameplay.isAuto) {
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
                  WebGAL.gameplay.performController.performList.push(p);
                  const originalStop = p.stopFunction;
                  p.goNextWhenOver = false;
                  p.stopFunction = () => {
                    originalStop();
                    executeJump();
                  };
                });
              } else {
                executeJump();
              }
            } else {
              executeJump();
            }
          };

          return (
            <div key={index} className={applyStyle('Thinking_Option_Container', styles.Thinking_Option_Container)}>
              {/* 按钮图标（如果有） */}
              {option.buttonIcon && (
                <div className={applyStyle('Thinking_Button_Icon', styles.Thinking_Button_Icon)}>
                  <img src={`./game/thinking_button/${option.buttonIcon}`} alt="button icon" />
                </div>
              )}

              {/* 气泡 */}
              <div
                className={`${applyStyle('Thinking_Bubble', styles.Thinking_Bubble)} ${
                  isBack ? applyStyle('Thinking_Back', styles.Thinking_Back) : ''
                }`}
                onClick={onClick}
                onMouseEnter={playSeEnter}
                onMouseOver={(e) => {
                  // 鼠标悬浮时切换到 hover 气泡
                  e.currentTarget.style.backgroundImage = `url(${messageBubbleHover})`;
                }}
                onMouseOut={(e) => {
                  // 鼠标离开时切换回普通气泡
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
}
