import styles from './textbox.module.scss';
import React, { ReactNode, useEffect } from 'react';
import { WebGAL } from '@/Core/WebGAL';
import { ITextboxProps } from './types';
import useApplyStyle from '@/hooks/useApplyStyle';
import { css } from '@emotion/css';
import { textSize } from '@/store/userDataInterface';
import textboxBg from '@/assets/dragonspring/textbox.png';
import nameBoxBg from '@/assets/dragonspring/namebox.png';

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

  function styleForIndex(i: number): { fontSize: string; color?: string; useLayer?: boolean } {
    if (i === 0) return { fontSize: '250%', color: '#FF1493', useLayer: false }; // 第1字：最大黑
    if (i === 1) return { fontSize: '150%', color: '#fff', useLayer: false }; // 第2字：常规白
    if (i === 2) return { fontSize: '220%', useLayer: true }; // 第3字：介于两者，用渐变+描边层
    return { fontSize: '150%', color: '#fff', useLayer: false }; // 其余：常规白
  }

  // 名字逐字渲染
  const nameElementList = showName.map((line, index) => {
    // 合并该行的 reactNode -> 纯文本（通常名字就一个节点）
    const text = line.map((en) => toPlainText(en.reactNode)).join('');
    const chars = Array.from(text); // 兼容中文/emoji

    const charSpans = chars.map((ch, i) => {
      const s = styleForIndex(i);
      const base: React.CSSProperties = {
        position: 'relative',
        display: 'inline-block',
        lineHeight: 1,
        marginRight: '0.1em',
      };

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

      // 其他字符：直接用颜色/大小
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
                    left: -150,
                    top: -200,
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
