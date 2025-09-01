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

/* ====== 根据全名取首字颜色（来自 characters.json）====== */
function getFirstCharColorByName(fullName: string): string | undefined {
  try {
    const key = fullName.trim();
    // @ts-ignore
    const color = (characters as Record<string, string>)[key];
    if (color && color.length > 0) return color;
  } catch {}
  return undefined;
}

/* ====== 不同下标的字符使用不同尺寸/样式 ====== */
interface CharStyle {
  fontSize: string;
  color?: string;
  useLayer?: boolean; // 是否使用 outer/inner 叠层描边
  outlineOnly?: boolean;
}

function styleForIndex(i: number, firstCharColor?: string): CharStyle {
  // 和 IMSSTextbox 的思路一致：0号字放大且上色；其余字带描边/渐变层
  if (i === 0) {
    if (firstCharColor) return { fontSize: '250%', color: firstCharColor, useLayer: false };
    return { fontSize: '250%', color: '#fff', useLayer: true }; // 没映射就白色并用描边层
  }
  if (i === 1) return { fontSize: '150%', color: '#fff', useLayer: true };
  if (i === 2) return { fontSize: '220%', color: '#fff', useLayer: true };
  return { fontSize: '150%', color: '#fff', useLayer: true };
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

      // ===== 名字（逐字渲染 + 首字上色 + 尺寸变化）=====
      // 之前逻辑：compileSentence -> nameElementList；这里改为转纯文本再拆字
      const nameRaw = compileSentence(backlogItem.currentStageState.showName, 3, true);
      const fullName = nameRaw.map((line) => line.map((c) => toPlainText(c.reactNode)).join('')).join('\n');
      const firstColor = getFirstCharColorByName(fullName);

      const nameChars = Array.from(fullName); // 逐字
      const nameCharSpans = nameChars.map((ch, idx) => {
        const s = styleForIndex(idx, firstColor);
        const baseStyle: React.CSSProperties = {
          fontSize: s.fontSize,
          color: s.color ?? '#fff',
        };

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

        // 普通实心（首字有颜色时用）
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
