import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { changeScene } from '@/Core/controller/scene/changeScene';
import { jmp } from '@/Core/gameScripts/label/jmp';
import ReactDOM from 'react-dom';
import React from 'react';
import styles from './choose.module.scss';
import { webgalStore } from '@/store/store';
import { textFont } from '@/store/userDataInterface';
import { PerformController } from '@/Core/Modules/perform/performController';
import { useSEByWebgalStore } from '@/hooks/useSoundEffect';
import { WebGAL } from '@/Core/WebGAL';
import { whenChecker } from '@/Core/controller/gamePlay/scriptExecutor';
import useEscape from '@/hooks/useEscape';
import useApplyStyle from '@/hooks/useApplyStyle';
import { Provider } from 'react-redux';
import choose01 from '@/assets/dragonspring/choose01.png';
import choose02 from '@/assets/dragonspring/choose02.png';
import skeleton from '@/assets/dragonspring/skeleton.png';

class ChooseOption {
  /**
   * 格式：
   * (showConditionVar>1)[enableConditionVar>2]->text:jump@skeleton
   * 或
   * text:jump@skeleton
   */
  public static parse(script: string): ChooseOption {
    const parts = script.split('->');
    const conditonPart = parts.length > 1 ? parts[0] : null;
    const mainPart = parts.length > 1 ? parts[1] : parts[0];
    const mainPartNodes = mainPart.split(/(?<!\\):/g);

    let jump = mainPartNodes[1] || '';
    let showSkeleton = false;

    // 检查 jump 末尾是否有 @skeleton 标记
    if (jump.endsWith('@skeleton')) {
      jump = jump.slice(0, -9); // 移除 '@skeleton' (9个字符)
      showSkeleton = true;
    }

    const option = new ChooseOption(mainPartNodes[0], jump);
    option.showSkeleton = showSkeleton;
    if (conditonPart !== null) {
      const showConditionPart = conditonPart.match(/\((.*)\)/);
      if (showConditionPart) {
        option.showCondition = showConditionPart[1];
      }
      const enableConditionPart = conditonPart.match(/\[(.*)\]/);
      if (enableConditionPart) {
        option.enableCondition = enableConditionPart[1];
      }
    }
    return option;
  }
  public text: string;
  public jump: string;
  public jumpToScene: boolean;
  public showCondition?: string;
  public enableCondition?: string;
  public showSkeleton?: boolean;

  public constructor(text: string, jump: string) {
    this.text = useEscape(text);
    this.jump = jump;
    this.jumpToScene = jump.match(/(?<!\\)\./) !== null;
  }
}

/**
 * 显示选择枝
 * @param sentence
 */
export const choose = (sentence: ISentence): IPerform => {
  const chooseOptionScripts = sentence.content.split(/(?<!\\)\|/);
  const chooseOptions = chooseOptionScripts.map((e) => ChooseOption.parse(e.trim()));

  // eslint-disable-next-line react/no-deprecated
  ReactDOM.render(
    <Provider store={webgalStore}>
      <Choose chooseOptions={chooseOptions} />
    </Provider>,
    document.getElementById('chooseContainer'),
  );
  return {
    performName: 'choose',
    duration: 1000 * 60 * 60 * 24,
    isHoldOn: false,
    stopFunction: () => {
      // eslint-disable-next-line react/no-deprecated
      ReactDOM.render(<div />, document.getElementById('chooseContainer'));
    },
    blockingNext: () => true,
    blockingAuto: () => true,
    stopTimeout: undefined, // 暂时不用，后面会交给自动清除
  };
};

function Choose(props: { chooseOptions: ChooseOption[] }) {
  const fontFamily = webgalStore.getState().userData.optionData.textboxFont;
  const font = fontFamily === textFont.song ? '"思源宋体", serif' : '"WebgalUI", serif';
  const { playSeEnter, playSeClick } = useSEByWebgalStore();
  const applyStyle = useApplyStyle('Stage/Choose/choose.scss');

  // 运行时计算JSX.Element[]
  const runtimeBuildList = (chooseListFull: ChooseOption[]) => {
    return chooseListFull
      .filter((e, i) => whenChecker(e.showCondition))
      .map((e, i) => {
        const enable = whenChecker(e.enableCondition);
        const className = enable
          ? applyStyle('Choose_item', styles.Choose_item)
          : applyStyle('Choose_item_disabled', styles.Choose_item_disabled);
        const onClick = enable
          ? () => {
              playSeClick();
              WebGAL.gameplay.performController.unmountPerform('choose');
              if (e.jumpToScene) {
                changeScene(e.jump, e.text);
              } else {
                jmp(e.jump);
              }
            }
          : () => {};

        return (
          <div className={applyStyle('Choose_item_outer', styles.Choose_item_outer)} key={e.jump + i}>
            {e.showSkeleton && (
              <img src={skeleton} alt="skeleton" className={applyStyle('Choose_skeleton', styles.Choose_skeleton)} />
            )}
            <div
              className={className}
              style={{
                fontFamily: font,
                backgroundImage: `url(${choose01})`, // 默认使用 choose01
                color: '#8E354A',
                margin: '6px 0',
                padding: '100px 140px',
              }}
              onClick={onClick}
              // onMouseEnter={playSeEnter}
              onMouseOver={(e) => {
                // 鼠标悬浮时切换到 choose02 并改变文字颜色
                e.currentTarget.style.backgroundImage = `url(${choose02})`;
                e.currentTarget.style.color = '#FFFFFF'; // 变为白色
              }}
              onMouseOut={(e) => {
                // 鼠标离开时切换回 choose01 并恢复文字颜色
                e.currentTarget.style.backgroundImage = `url(${choose01})`;
                e.currentTarget.style.color = '#8E354A'; // 恢复默认颜色
              }}
            >
              {e.text}
            </div>
          </div>
        );
      });
  };

  return <div className={applyStyle('Choose_Main', styles.Choose_Main)}>{runtimeBuildList(props.chooseOptions)}</div>;
}
