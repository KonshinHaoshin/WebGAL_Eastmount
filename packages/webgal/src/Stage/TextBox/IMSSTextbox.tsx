import styles from './textbox.module.scss';
import React, { ReactNode, useEffect } from 'react';
import { WebGAL } from '@/Core/WebGAL';
import { ITextboxProps } from './types';
import useApplyStyle from '@/hooks/useApplyStyle';
import { css } from '@emotion/css';
import { textSize } from '@/store/userDataInterface';
import textboxBg from '@/assets/dragonspring/textbox.png';
import nameBoxBg from '@/assets/dragonspring/namebox.png';
import characters from '@/assets/dragonspring/characters.json';

export default function IMSSTextbox(props: ITextboxProps) {
  const {
    textArray,
    textDelay,
    currentConcatDialogPrev,
    currentDialogKey,
    isText,
    isSafari,
    isFirefox: boolean,
    fontSize,
    miniAvatar,
    isHasName,
    showName,
    font,
    textDuration,
    isUseStroke,
    textboxOpacity,
    textSizeState,
  } = props;

  const applyStyle = useApplyStyle('Stage/TextBox/textbox.scss');

  useEffect(() => {
    function settleText() {
      const textElements = document.querySelectorAll('.Textelement_start');
      const textArray = [...(textElements as unknown as HTMLElement[])];
      textArray.forEach((e) => {
        e.className = applyStyle('TextBox_textElement_Settled', styles.TextBox_textElement_Settled);
      });
    }

    WebGAL.events.textSettle.on(settleText);
    return () => {
      WebGAL.events.textSettle.off(settleText);
    };
  }, [applyStyle]);

  let allTextIndex = 0;

  // 两个工具
  function toPlainText(node: React.ReactNode): string {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(toPlainText).join('');
    // eslint-disable-next-line no-eq-null,eqeqeq
    if (node == null) return '';
    // @ts-ignore
    if (typeof node.props?.children !== 'undefined') {
      // @ts-ignore
      return toPlainText(node.props.children);
    }
    return String(node as any);
  }

  function getFirstCharColorByName(fullName: string): string | undefined {
    try {
      // characters.json 形如：{ "千早爱音":"#FF8899", ... }
      // 完整匹配：优先用全名
      // 需要支持“去空格/全角空白”可以在此处清洗
      const key = fullName.trim();
      // @ts-ignore
      const color = (characters as Record<string, string>)[key];
      if (color.length > 0) return color;
    } catch {}
    return undefined;
  }

  interface CharStyle {
    fontSize: string;
    color?: string;
    useLayer?: boolean; // 使用 outerName/innerName 叠层（渐变+描边）
    outlineOnly?: boolean; // 只描边（透明填充）
    strokeWidthEm?: number; // 描边宽度（em）
  }

  function styleForIndex(i: number, firstCharColor?: string): CharStyle {
    if (i === 0) {
      // 首字母：有颜色 → 实心；无映射 → 只描边（白色）
      if (firstCharColor) {
        return { fontSize: '250%', color: firstCharColor, useLayer: false };
      }
      return { fontSize: '250%', color: '#fff', useLayer: true }; // 透明填充 + 白描边
    }
    if (i === 1) return { fontSize: '150%', color: '#fff', useLayer: true };
    if (i === 2) return { fontSize: '220%', useLayer: true };
    return { fontSize: '150%', color: '#fff', useLayer: true };
  }

  // 名字逐字渲染
  const nameElementList = showName.map((line, index) => {
    const fullText = line.map((en) => toPlainText(en.reactNode)).join('');
    const chars = Array.from(fullText);
    const firstColor = getFirstCharColorByName(fullText); // ★ 从映射里取首字母主题色

    const charSpans = chars.map((ch, i) => {
      const s = styleForIndex(i, firstColor);
      const base: React.CSSProperties = {
        position: 'relative',
        display: 'inline-block',
        lineHeight: 1,
        marginRight: '0.1em',
      };

      if (s.outlineOnly) {
        return (
          <span
            key={`${ch}-${i}`}
            style={{
              ...base,
              fontSize: s.fontSize,
              color: 'transparent',
            }}
          >
            {ch}
          </span>
        );
      }

      // 叠层：outerName/innerName（渐变 + 可选描边）
      if (s.useLayer) {
        return (
          <span key={`${ch}-${i}`} style={{ ...base, fontSize: s.fontSize }}>
            <span className={styles.zhanwei}>
              {ch}
              <span className={applyStyle('outerName', styles.outerName)}>{ch}</span>
              {isUseStroke && <span className={applyStyle('innerName', styles.innerName)}>{ch}</span>}
            </span>
          </span>
        );
      }

      // 普通实心（用于有颜色的首字母）
      return (
        <span key={`${ch}-${i}`} style={{ ...base, fontSize: s.fontSize, color: s.color }}>
          {ch}
        </span>
      );
    });

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          wordBreak: isSafari || props.isFirefox ? 'break-all' : undefined,
          flexWrap: isSafari ? 'wrap' : undefined,
        }}
        key={`name-line-${index}`}
      >
        {charSpans}
      </div>
    );
  });

  // ==== 对话正文渲染（保持你原逻辑）====
  const textElementList = textArray.map((line, index) => {
    const textLine = line.map((en, idx) => {
      const e = en.reactNode as ReactNode;
      let style = '';
      let tips = '';
      let style_alltext = '';

      if (en.enhancedValue) {
        const data = en.enhancedValue;
        for (const dataElem of data) {
          const { key, value } = dataElem;
          switch (key) {
            case 'style':
              style = value;
              break;
            case 'tips':
              tips = value;
              break;
            case 'style-alltext':
              style_alltext = value;
              break;
          }
        }
      }

      let delay = allTextIndex * textDelay;
      allTextIndex++;
      const prevLength = currentConcatDialogPrev.length;

      if (currentConcatDialogPrev !== '' && allTextIndex >= prevLength) {
        delay = delay - prevLength * textDelay;
      }

      const styleClassName = ' ' + css(style);
      const styleAllText = ' ' + css(style_alltext);

      if (allTextIndex < prevLength) {
        return (
          <span
            id={`${delay}`}
            className={applyStyle('TextBox_textElement_Settled', styles.TextBox_textElement_Settled)}
            key={currentDialogKey + idx}
            style={{ animationDelay: `${delay}ms`, animationDuration: `${textDuration}ms` }}
          >
            <span className={styles.zhanwei + styleAllText}>
              {e}
              <span className={applyStyle('outer', styles.outer) + styleClassName + styleAllText}>{e}</span>
              {isUseStroke && <span className={applyStyle('inner', styles.inner) + styleAllText}>{e}</span>}
            </span>
          </span>
        );
      }

      return (
        <span
          id={`${delay}`}
          className={`${applyStyle('TextBox_textElement_start', styles.TextBox_textElement_start)} Textelement_start`}
          key={currentDialogKey + idx}
          style={{ animationDelay: `${delay}ms`, position: 'relative' }}
        >
          <span className={styles.zhanwei + styleAllText}>
            {e}
            <span className={applyStyle('outer', styles.outer) + styleClassName + styleAllText}>{e}</span>
            {isUseStroke && <span className={applyStyle('inner', styles.inner) + styleAllText}>{e}</span>}
          </span>
        </span>
      );
    });

    return (
      <div
        style={{
          wordBreak: isSafari || props.isFirefox ? 'break-all' : undefined,
          display: isSafari ? 'flex' : undefined,
          flexWrap: isSafari ? 'wrap' : undefined,
        }}
        key={`text-line-${index}`}
      >
        {textLine}
      </div>
    );
  });

  const lineHeightCssStr = `line-height: ${textSizeState === textSize.medium ? '2.2em' : '2em'}`;
  const lhCss = css(lineHeightCssStr);

  return (
    <>
      {isText && (
        <div className={styles.TextBox_Container}>
          {/* 全屏 PNG 背景 */}
          <div
            aria-hidden
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2,
              pointerEvents: 'none',
              backgroundImage: `url(${textboxBg})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              opacity: textboxOpacity / 100,
            }}
          />

          {/* 文字层：透明，仅用于定位/排版 */}
          <div
            id="textBoxMain"
            className={
              applyStyle('TextBox_main', styles.TextBox_main) +
              ' ' +
              (miniAvatar === ''
                ? applyStyle('TextBox_main_miniavatarOff', styles.TextBox_main_miniavatarOff)
                : undefined)
            }
            style={{
              fontFamily: font,
              background: 'transparent',
            }}
          >
            <div id="miniAvatar" className={applyStyle('miniAvatarContainer', styles.miniAvatarContainer)}>
              {miniAvatar !== '' && (
                <img className={applyStyle('miniAvatarImg', styles.miniAvatarImg)} alt="miniAvatar" src={miniAvatar} />
              )}
            </div>

            {isHasName && (
              <>
                {/* namebox 背景图，直接铺满全屏 */}
                <div
                  aria-hidden
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 3,
                    pointerEvents: 'none',
                    backgroundImage: `url(${nameBoxBg})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    opacity: textboxOpacity / 100,
                  }}
                />

                {/* 名字：按屏幕坐标固定位置 */}
                <div
                  className={applyStyle('TextBox_showName', styles.TextBox_showName)}
                  style={{
                    position: 'absolute',
                    left: -165,
                    top: -190,
                    fontSize: '200%', // 作为整体基准，不影响逐字 fontSize 的相对大小
                    background: 'transparent',
                    border: 0,
                    zIndex: 4,
                  }}
                >
                  {nameElementList}
                </div>
              </>
            )}

            {/* 对话正文 */}
            <div
              className={`${lhCss} ${applyStyle('text', styles.text)}`}
              style={{
                fontSize,
                flexFlow: 'column',
                overflow: 'hidden',
                paddingLeft: '0.1em',
              }}
            >
              {textElementList}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
