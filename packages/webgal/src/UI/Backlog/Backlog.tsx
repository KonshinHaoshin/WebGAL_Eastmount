import styles from './backlog.module.scss';
import { CloseSmall, VolumeNotice } from '@icon-park/react';
import { jumpFromBacklog } from '@/Core/controller/storage/jumpFromBacklog';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, webgalStore } from '@/store/store';
import { setVisibility } from '@/store/GUIReducer';
import { logger } from '@/Core/util/logger';
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import useTrans from '@/hooks/useTrans';
import { compileSentence } from '@/Stage/TextBox/TextBox';
import useSoundEffect from '@/hooks/useSoundEffect';
import { WebGAL } from '@/Core/WebGAL';
import backlogBg from '@/assets/dragonspring/backlog.png';
import backlog_item_button from '@/assets/dragonspring/backlog_item_left.png';
import backlog_item_nameContainer from '@/assets/dragonspring/namebox.png';
import characters from '@/assets/dragonspring/characters.json';

/* ====== 工具函数：把 ReactNode 转为纯文本 ====== */
function toPlainText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(toPlainText).join('');
  // eslint-disable-next-line no-eq-null,eqeqeq
  if (node == null) return '';
  // @ts-ignore
  if (typeof node?.props?.children !== 'undefined') {
    // @ts-ignore
    return toPlainText(node.props.children);
  }
  return String(node as any);
}

/** 仅英文字母首字母大写（中文不变） */
function upperFirstLatin(ch: string) {
  return /^[a-z]/.test(ch) ? ch.toUpperCase() : ch;
}

/** 强化空白归一 */
function normalizeSpaces(s: string) {
  return s
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u2060\u3000\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function compact(s: string) {
  return normalizeSpaces(s).replace(/\s+/g, '');
}

/** 把输入名映射到 characters.json 的规范键（含空格），并返回颜色 */
function resolveCanonicalNameAndColor(inputName: string): { canonicalKey: string; color?: string } {
  const dict = characters as Record<string, string>;

  const rawNorm = normalizeSpaces(inputName);
  const rawComp = compact(inputName);

  // a) 紧凑匹配（“千早爱音”≈“千早 爱音”）
  for (const k of Object.keys(dict)) {
    if (compact(k) === rawComp) {
      const ck = normalizeSpaces(k);
      const color = dict[k];
      return color ? { canonicalKey: ck, color } : { canonicalKey: ck };
    }
  }

  // b) 直接匹配（用户本就输入了空格）
  if (dict[rawNorm]) {
    return { canonicalKey: rawNorm, color: dict[rawNorm] };
  }

  // c) 兜底：返回规范化文本
  return { canonicalKey: rawNorm };
}

/* ====== 不同下标的字符使用不同尺寸/样式 ====== */
interface CharStyle {
  fontSize: string;
  color?: string;
  useLayer?: boolean; // 是否使用 outer/inner 叠层描边
  outlineOnly?: boolean;
}

interface StyleOpts {
  isSurnameFirst: boolean; // 姓首字
  isGivenFirst: boolean; // 名首字
  hasSurname: boolean; // 是否有“姓 名”结构
  surnameColor?: string; // 姓首字颜色
}

function styleForIndex(i: number, opt: StyleOpts): CharStyle {
  const { isSurnameFirst, isGivenFirst, hasSurname, surnameColor } = opt;

  // 姓首字 250%，名首字 200%，其余 150%（统一）
  const size = isSurnameFirst ? '250%' : isGivenFirst ? '200%' : '150%';

  if (isSurnameFirst) {
    if (surnameColor) return { fontSize: size, color: surnameColor, useLayer: false };
    return { fontSize: size, color: '#fff', useLayer: true };
  }
  if (isGivenFirst) {
    return { fontSize: size, color: '#fff', useLayer: true };
  }
  if (!hasSurname && i === 0) {
    return { fontSize: '200%', color: '#fff', useLayer: true };
  }
  return { fontSize: size, color: '#fff', useLayer: true };
}

export const Backlog = () => {
  const t = useTrans('gaming.');
  const { playSeEnter, playSeClick } = useSoundEffect();
  const GUIStore = useSelector((state: RootState) => state.GUI);
  const isBacklogOpen = GUIStore.showBacklog;
  const dispatch = useDispatch();
  const iconSize = '0.8em';
  const [indexHide, setIndexHide] = useState(false);
  const [isDisableScroll, setIsDisableScroll] = useState(false);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (!isBacklogOpen) return;
    const options = { root: null, rootMargin: '0px', threshold: [1.0] };
    const observer = new IntersectionObserver((entries) => {
      if ((entries?.[0]?.intersectionRatio ?? 0) <= 0) return;
      setLimit((prev) => prev + 20);
    }, options);

    const observeTarget = document.querySelector(`#backlog_item_${limit - 5}`);
    if (observeTarget) observer.observe(observeTarget);
    return () => observer.disconnect();
  }, [limit, isBacklogOpen]);

  useEffect(() => {
    if (!isBacklogOpen) setLimit(20);
  }, [isBacklogOpen]);

  const timeRef = useRef<ReturnType<typeof setTimeout>>();

  // === 渲染列表 ===
  // eslint-disable-next-line no-undef
  const backlogList = useMemo<JSX.Element[]>(() => {
    // eslint-disable-next-line no-undef
    const backlogs: JSX.Element[] = [];
    const current_backlog_len = WebGAL.backlogManager.getBacklog().length;

    for (let i = 0; i < Math.min(current_backlog_len, limit); i++) {
      const indexOfBacklog = current_backlog_len - i - 1;
      const backlogItem = WebGAL.backlogManager.getBacklog()[indexOfBacklog];

      // ===== 正文 =====
      const showTextArray = compileSentence(backlogItem.currentStageState.showText, 3, true, false);
      const showTextArray2 = showTextArray.map((line) => line.map((c) => c.reactNode));
      const showTextArrayReduced = mergeStringsAndKeepObjects(showTextArray2);
      const showTextElementList = showTextArrayReduced.map((line, idx) => (
        <div key={`backlog-line-${idx}`}>{line.map((e, i2) => (e === '<br />' ? <br key={`br${i2}`} /> : e))}</div>
      ));

      /// ===== 名字（与 IMSSTextbox 同步）=====
      const nameRaw = compileSentence(backlogItem.currentStageState.showName, 3, true);
      const fullNameInput = nameRaw.map((line) => line.map((c) => toPlainText(c.reactNode)).join('')).join('\n');

      const { canonicalKey, color: surnameColor } = resolveCanonicalNameAndColor(fullNameInput);

      // 拆分“姓 名”
      const tokens = canonicalKey.split(' ');
      const hasSurnameGiven = tokens.length >= 2;
      const surname = hasSurnameGiven ? tokens[0] : '';
      const given = hasSurnameGiven ? tokens.slice(1).join('') : '';

      // 显示文本（去空格并拼回）
      const display = hasSurnameGiven ? surname + given : canonicalKey;
      const chars = Array.from(display);
      const givenStartIndex = hasSurnameGiven ? surname.length : -1;

      const nameCharSpans = chars.map((origCh, idx) => {
        const isSurnameFirst = idx === 0 && hasSurnameGiven;
        const isGivenFirst = idx === givenStartIndex && hasSurnameGiven;
        const isOnlyFirst = !hasSurnameGiven && idx === 0;

        const ch = isSurnameFirst || isGivenFirst || isOnlyFirst ? upperFirstLatin(origCh) : origCh;

        const s = styleForIndex(idx, {
          isSurnameFirst,
          isGivenFirst,
          hasSurname: hasSurnameGiven,
          surnameColor,
        });

        const baseStyle: React.CSSProperties = {
          fontSize: s.fontSize,
          color: s.color ?? '#fff',
          lineHeight: 1,
          // 让每个字不额外拉开
          marginRight: 0,
        };

        // 姓首字有颜色：纯色实心
        if (isSurnameFirst && surnameColor) {
          return (
            <span key={`${ch}-${idx}`} className={styles.name_char} style={baseStyle}>
              {ch}
            </span>
          );
        }

        // 其它：叠层（与 IMSSTextbox outerName/innerName 等价）
        if (s.useLayer) {
          return (
            <span key={`${ch}-${idx}`} className={styles.name_char} style={baseStyle}>
              <span className={styles.name_zhanwei}>
                {ch}
                <span className={styles.name_outer}>{ch}</span>
                <span className={styles.name_inner}>{ch}</span>
              </span>
            </span>
          );
        }

        // 兜底（基本不会到）
        return (
          <span key={`${ch}-${idx}`} className={styles.name_char} style={baseStyle}>
            {ch}
          </span>
        );
      });

      const nameElement = (
        <div className={styles.name_line} key={`name-line-${i}`}>
          {nameCharSpans}
        </div>
      );

      backlogs.push(
        <div
          className={styles.backlog_item}
          id={`backlog_item_${i}`}
          style={{ animationDelay: `${20 * ((i - 1) % 20)}ms` }}
          key={'backlogItem' + backlogItem.currentStageState.showText + backlogItem.saveScene.currentSentenceId}
        >
          {/* 左：按钮 | 名字底板+文字 */}
          <div className={styles.backlog_func_area}>
            <div className={styles.backlog_item_button_list}>
              <div
                onClick={(e) => {
                  playSeClick();
                  jumpFromBacklog(indexOfBacklog);
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseEnter={playSeEnter}
                className={styles.backlog_item_button_element}
              >
                <img src={backlog_item_button} alt="return" className={styles.backlog_item_button_img} />
              </div>

              {backlogItem.currentStageState.vocal ? (
                <div
                  onClick={() => {
                    playSeClick();
                    const el = document.getElementById(
                      'backlog_audio_play_element_' + indexOfBacklog,
                    ) as HTMLAudioElement | null;
                    if (el) {
                      el.currentTime = 0;
                      const userDataStore = webgalStore.getState().userData;
                      const mainVol = userDataStore.optionData.volumeMain;
                      el.volume = mainVol * 0.01 * (userDataStore.optionData.vocalVolume * 0.01);
                      // eslint-disable-next-line no-void
                      el.play().catch(() => void 0);
                    }
                  }}
                  onMouseEnter={playSeEnter}
                  className={styles.backlog_item_button_element}
                  aria-label="play voice"
                  title="播放语音"
                >
                  <VolumeNotice theme="outline" size={iconSize} fill="#ffffff" strokeWidth={3} />
                </div>
              ) : null}
            </div>

            {/* 名字底板 + 名字文字（底图在下，文字在上） */}
            <div className={styles.backlog_item_content_name}>
              <img src={backlog_item_nameContainer} alt="namebox" className={styles.name_container_bg} />
              <div className={styles.name_container_text}>{nameElement}</div>
            </div>
          </div>

          {/* 右：正文 */}
          <div className={styles.backlog_item_content}>
            <span className={styles.backlog_item_content_text}>{showTextElementList}</span>
          </div>

          {/* 语音元素（如有） */}
          <audio id={'backlog_audio_play_element_' + indexOfBacklog} src={backlogItem.currentStageState.vocal ?? ''} />
        </div>,
      );
    }
    return backlogs;
  }, [
    WebGAL.backlogManager.getBacklog()[WebGAL.backlogManager.getBacklog().length - 1]?.saveScene?.currentSentenceId ??
      0,
    limit,
  ]);

  // 显隐切换时的滚动/层级管理
  useEffect(() => {
    if (GUIStore.showBacklog) {
      if (timeRef.current) clearTimeout(timeRef.current);
      setIndexHide(false);
      setIsDisableScroll(true);
      setTimeout(() => setIsDisableScroll(false), 0);
    } else {
      timeRef.current = setTimeout(() => {
        setIndexHide(true);
        timeRef.current = undefined;
      }, 700 + 80);
    }
  }, [GUIStore.showBacklog]);

  return (
    <div
      className={`
          ${GUIStore.showBacklog ? styles.Backlog_main : styles.Backlog_main_out}
          ${indexHide ? styles.Backlog_main_out_IndexHide : ''}
        `}
      style={{ ['--backlog-bg' as any]: `url(${backlogBg})` }}
    >
      <div className={styles.backlog_top}>
        <CloseSmall
          className={styles.backlog_top_icon}
          onClick={() => {
            playSeClick();
            dispatch(setVisibility({ component: 'showBacklog', visibility: false }));
            dispatch(setVisibility({ component: 'showTextBox', visibility: true }));
          }}
          onMouseEnter={playSeEnter}
          theme="outline"
          size="4em"
          fill="#ffffff"
          strokeWidth={3}
        />
        <div
          className={styles.backlog_title}
          onClick={() => {
            logger.info('Rua! Testing');
          }}
        >
          {t('buttons.backlog')}
        </div>
      </div>

      {GUIStore.showBacklog && (
        <div className={`${styles.backlog_content} ${isDisableScroll ? styles.Backlog_main_DisableScroll : ''}`}>
          {backlogList}
        </div>
      )}
    </div>
  );
};

/**
 * 把连续的字符串合并，但保留 React 节点（如 <span/>、<br/> 等）
 * 输入：ReactNode[][]（每行的节点数组）
 * 输出：ReactNode[][]（同结构，字符串已合并）
 */
export function mergeStringsAndKeepObjects(arr: ReactNode[][]): ReactNode[][] {
  return arr.map((line) => {
    const result: ReactNode[] = [];
    let current = '';
    for (const item of line) {
      if (typeof item === 'string') {
        current += item;
      } else {
        if (current) {
          result.push(current);
          current = '';
        }
        result.push(item);
      }
    }
    if (current) result.push(current);
    return result;
  });
}
