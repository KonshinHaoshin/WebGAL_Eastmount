import styles from './textbox.module.scss';
import React, { ReactNode, useEffect, useState } from 'react';
import { WebGAL } from '@/Core/WebGAL';
import { ITextboxProps } from './types';
import useApplyStyle from '@/hooks/useApplyStyle';
import { css } from '@emotion/css';
import { textSize } from '@/store/userDataInterface';
import textboxBg from '@/assets/dragonspring/textbox.png';
import nameBoxBg from '@/assets/dragonspring/namebox.png';
import characters from '@/assets/dragonspring/characters.json';
import button_on from '@/assets/dragonspring/button_on.png';
import button_off from '@/assets/dragonspring/button_off.png';
import { switchAuto } from '@/Core/controller/gamePlay/autoPlay';
import useSoundEffect from '@/hooks/useSoundEffect';
import cursor from '@/assets/dragonspring/cursor.png';

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
    isAuto,
  } = props;
  const [isClicked, setIsClicked] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const applyStyle = useApplyStyle('Stage/TextBox/textbox.scss');
  const { playSeClick } = useSoundEffect();

  // 直接监听 WebGAL.gameplay.isAuto 的变化，确保无论从哪里调用 stopAuto() 都能立即更新
  useEffect(() => {
    const checkAutoMode = () => {
      const currentAutoState = WebGAL.gameplay.isAuto;
      setIsClicked((prevState) => {
        // 只有当状态真正改变时才更新，避免不必要的重渲染
        if (currentAutoState !== prevState) {
          return currentAutoState;
        }
        return prevState;
      });
    };

    // 立即检查一次
    checkAutoMode();

    // 定期检查auto模式状态（与 TextBox.tsx 使用相同的检查间隔）
    const interval = setInterval(checkAutoMode, 100);

    return () => clearInterval(interval);
  }, []); // 空依赖数组，只在组件挂载时运行一次

  // 同时监听 isAuto prop 的变化，作为备用同步机制
  useEffect(() => {
    setIsClicked(isAuto);
  }, [isAuto]);

  // 处理auto按钮点击
  const handleAutoClick = () => {
    switchAuto();
    playSeClick();
    // 立即更新按钮状态（乐观更新），确保按钮立即响应
    // 直接读取 WebGAL.gameplay.isAuto 的当前值，因为 switchAuto() 已经改变了它
    // useEffect 会在 isAuto prop 更新后再次同步，确保最终一致性
    setIsClicked(WebGAL.gameplay.isAuto);
  };

  useEffect(() => {
    function settleText() {
      const textElements = document.querySelectorAll('.Textelement_start');
      const textArray = [...(textElements as unknown as HTMLElement[])];
      textArray.forEach((e) => {
        e.className = applyStyle('TextBox_textElement_Settled', styles.TextBox_textElement_Settled);
      });
      // 点击后立即显示全部文字时，也立即显示 cursor
      setShowCursor(true);
    }

    WebGAL.events.textSettle.on(settleText);
    return () => {
      WebGAL.events.textSettle.off(settleText);
    };
  }, [applyStyle]);

  // 当对话键变化时，隐藏 cursor
  useEffect(() => {
    setShowCursor(false);
  }, [currentDialogKey]);

  // 计算文本动画完成时间并自动显示 cursor（与 say.ts 使用相同的逻辑）
  useEffect(() => {
    if (!isText || textArray.length === 0) {
      setShowCursor(false);
      return;
    }

    // 计算文本总字符数（与 say.ts 中的逻辑一致）
    let totalChars = 0;
    textArray.forEach((line) => {
      line.forEach(() => {
        totalChars++;
      });
    });

    // 计算文本播放结束时间（与 say.ts 中的计算逻辑完全一致）
    // say.ts 中的计算：
    // - sentenceDelay = textDelay * len (所有字符数 * textDelay)
    // - endDelay = useTextAnimationDuration(textSpeed) / 2 (textDuration / 2)
    // - duration = sentenceDelay + endDelay
    const sentenceDelay = totalChars * textDelay; // 所有字符延迟的总和
    const endDelay = textDuration / 2; // 动画持续时间的一半
    const totalAnimationTime = sentenceDelay + endDelay;

    // 在动画完成后自动显示 cursor（不依赖点击，与 say.ts 的 stopFunction 时机一致）
    const timer = setTimeout(() => {
      setShowCursor(true);
    }, totalAnimationTime);

    return () => {
      clearTimeout(timer);
    };
  }, [textArray, textDelay, textDuration, isText, currentDialogKey]);

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

  function upperFirstLatin(ch: string) {
    // 仅对英文字母有效；汉字等不改变
    if (/^[a-z]/.test(ch)) return ch.toUpperCase();
    return ch;
  }

  function normalizeSpaces(s: string) {
    // 统一空白：去首尾、将全角空格转半角、压缩中间多空格为一个
    return s
      .replace(/\u3000/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }
  function compact(s: string) {
    // 去除所有空白，用于“千早爱音” ≈ “千早 爱音”的匹配
    return normalizeSpaces(s).replace(/\s+/g, '');
  }

  /** 返回：{ canonicalKey, color }
   * canonicalKey 是在 characters.json 中存在的“规范键”（含空格，如“千早 爱音”）
   * 若找不到，canonicalKey 为 normalize 后的原文，color 为 undefined
   */
  function resolveCanonicalNameAndColor(inputName: string): { canonicalKey: string; color?: string } {
    const raw = normalizeSpaces(inputName);
    const compactInput = compact(raw);

    // 1) 先尝试字典“紧凑匹配”：去空格后相等则认为是该键
    const dict = characters as Record<string, string>;
    for (const k of Object.keys(dict)) {
      if (compact(k) === compactInput) {
        const color = dict[k];
        if (color && color.length > 0) {
          return { canonicalKey: normalizeSpaces(k), color };
        }
        return { canonicalKey: normalizeSpaces(k) };
      }
    }

    // 2) 再尝试直接键匹配（用户本就输入了空格）
    const directKey = normalizeSpaces(raw);
    if (dict[directKey]) {
      return { canonicalKey: directKey, color: dict[directKey] };
    }

    // 3) 找不到就返回 normalize 后文本，颜色为空
    return { canonicalKey: directKey };
  }

  interface CharStyle {
    fontSize: string;
    color?: string;
    useLayer?: boolean; // 使用 outerName/innerName 叠层（渐变+描边）
    outlineOnly?: boolean; // 只描边（透明填充）
    strokeWidthEm?: number; // 描边宽度（em）
  }

  interface StyleOpts {
    isSurnameFirst: boolean; // 姓氏首字
    isGivenFirst: boolean; // 名字首字
    hasSurname: boolean; // 是否有“姓 名”结构
    surnameColor?: string; // 姓首字颜色
  }

  function styleForIndex(i: number, opt: StyleOpts): CharStyle {
    const { isSurnameFirst, isGivenFirst, hasSurname, surnameColor } = opt;

    // ✅ 统一规则：
    // - 姓首字：250%
    // - 名首字：200%（表现“首字大写”的强调）
    // - 其他：  150%（全部相同）
    const size = isSurnameFirst ? '250%' : isGivenFirst ? '200%' : '150%';

    // 1) 姓首字：有颜色→纯色实心；无颜色→叠层白描边
    if (isSurnameFirst) {
      if (surnameColor) return { fontSize: size, color: surnameColor, useLayer: false };
      return { fontSize: size, color: '#fff', useLayer: true };
    }

    // 2) 名首字：仅强调（加大字号），颜色不变，走叠层
    if (isGivenFirst) {
      return { fontSize: size, color: '#fff', useLayer: true };
    }

    // 3) 无姓氏之分：唯一首字也要强调（200%），其余 150%
    if (!hasSurname && i === 0) {
      return { fontSize: '200%', color: '#fff', useLayer: true };
    }

    // 4) 普通字：统一 150%，叠层
    return { fontSize: size, color: '#fff', useLayer: true };
  }

  // 名字逐字渲染
  // 名字逐字渲染（带“姓/名”逻辑 + 自动匹配字典键）
  const nameElementList = showName.map((line, index) => {
    const fullText = line.map((en) => toPlainText(en.reactNode)).join('');

    // 拿到规范键（含空格）与颜色
    const { canonicalKey, color: surnameColor } = resolveCanonicalNameAndColor(fullText);

    // 拆分姓/名（若没有空格，则认为无姓氏之分）
    const tokens = canonicalKey.split(' ');
    const hasSurnameGiven = tokens.length >= 2;
    const surname = hasSurnameGiven ? tokens[0] : '';
    const given = hasSurnameGiven ? tokens.slice(1).join('') : '';

    // 组合成最终要显示的字符数组
    const display = hasSurnameGiven ? surname + given : canonicalKey;
    const chars = Array.from(display);

    // 计算“名”的起始下标（仅在有姓氏时有效）
    const givenStartIndex = hasSurnameGiven ? surname.length : -1;

    // 渲染函数：保持你原有的大小/描边叠层策略，但根据首字位置调整颜色/大写
    const charSpans = chars.map((origCh, i) => {
      // 按规则处理大写：姓首字 & 名首字（仅 ASCII 有效）
      const isSurnameFirst = i === 0 && hasSurnameGiven;
      const isGivenFirst = i === givenStartIndex && hasSurnameGiven;
      const isOnlyFirst = !hasSurnameGiven && i === 0;

      const ch = isSurnameFirst || isGivenFirst || isOnlyFirst ? upperFirstLatin(origCh) : origCh;

      // 复用你原有的风格分配（会给不同序号不同 fontSize/叠层）
      const s = styleForIndex(i, {
        isSurnameFirst,
        isGivenFirst,
        hasSurname: hasSurnameGiven,
        surnameColor, // string | undefined 没问题，因为 StyleOpts 里是可选
      });

      const base: React.CSSProperties = {
        position: 'relative',
        display: 'inline-block',
        lineHeight: 1,
        marginRight: 0,
      };

      // 规则补充：
      // 1) 姓首字：若有颜色映射 → 纯色实心（不走叠层）+ 大写
      if (isSurnameFirst && surnameColor) {
        return (
          <span key={`${ch}-${i}`} style={{ ...base, fontSize: s.fontSize, color: surnameColor, left: '20px' }}>
            {ch}
          </span>
        );
      }

      // 2) 名首字：仅大写，不改颜色；走原有叠层（白 + 描边）
      // 3) 无姓氏之分时：仅首字大写，不改颜色；走原有叠层
      //    => 这两种都沿用“useLayer”的路径
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

      // 其它情况（很少触发）：按你原逻辑
      if (s.outlineOnly) {
        return (
          <span key={`${ch}-${i}`} style={{ ...base, fontSize: s.fontSize, color: 'transparent' }}>
            {ch}
          </span>
        );
      }
      return (
        <span key={`${ch}-${i}`} style={{ ...base, fontSize: s.fontSize, color: s.color ?? '#fff' }}>
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

            {/* Auto按钮 */}
            <div
              style={{
                position: 'fixed',
                left: 40,
                top: 1260,
                zIndex: 99999,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'auto',
              }}
              onClick={handleAutoClick}
            >
              <img
                src={isClicked ? button_on : button_off}
                alt="auto_button"
                style={{
                  width: 'auto',
                  height: 'auto',
                }}
                draggable={false}
              />
            </div>

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

            {/* Cursor - 文本播放完成后显示并闪烁 */}
            {showCursor && <img src={cursor} alt="cursor" className={styles.textBoxCursor} />}
          </div>
        </div>
      )}
    </>
  );
}
