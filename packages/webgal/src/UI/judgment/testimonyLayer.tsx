import React, { FC, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';
import { changeScene } from '@/Core/controller/scene/changeScene';
import { stopAuto } from '@/Core/controller/gamePlay/autoPlay';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';
import { WebGAL } from '@/Core/WebGAL';
import { jmp } from '@/Core/gameScripts/label/jmp';
import styles from './testimonyLayer.module.scss';
import { ITestimonyData } from '@/store/stageInterface';

export const TestimonyLayer: FC = () => {
  const dispatch = useDispatch();
  const testimonyDataList = useSelector((state: RootState) => state.stage.testimonyData);
  const judgment = useSelector((state: RootState) => state.stage.judgment);

  // 如果不在审判模式（或视频播放中），不渲染
  if (judgment === '' || judgment === 'video_playing') {
    return null;
  }

  const handleKeywordClick = (target: string) => {
    const targetStr = target.toString().trim();

    // 检查是否是行内思考模式
    if (targetStr.startsWith('thinking:')) {
      const content = targetStr.replace('thinking:', '').trim();
      const firstSpaceIndex = content.indexOf(' ');
      if (firstSpaceIndex !== -1) {
        const avatar = content.substring(0, firstSpaceIndex).trim();
        const optionsPart = content.substring(firstSpaceIndex + 1);
        const parts = optionsPart.split('|');
        const options = parts.map((opt) => {
          const trimmedOpt = opt.trim();
          if (trimmedOpt === '@back') {
            return { label: '返回', target: '@back' };
          }
          // 解析 文本:目标@图标 格式
          const colonIndex = trimmedOpt.indexOf(':');
          if (colonIndex === -1) {
            return { label: trimmedOpt, target: trimmedOpt };
          }
          const label = trimmedOpt.substring(0, colonIndex).trim();
          const rest = trimmedOpt.substring(colonIndex + 1).trim();
          const args = rest.split('@');
          const target = args[0].trim();
          let icon: string | undefined;
          let refuteVideo: string | undefined;

          args.slice(1).forEach((arg) => {
            const trimmedArg = arg.trim();
            if (trimmedArg.startsWith('icon=')) {
              icon = trimmedArg.substring(5).trim();
            } else if (trimmedArg.startsWith('refute=')) {
              refuteVideo = trimmedArg.substring(7).trim();
            } else if (!icon) {
              icon = trimmedArg;
            }
          });

          return { label, target, icon, refuteVideo };
        });
        dispatch(setStage({ key: 'inlineThinking', value: { avatar, options } }));
        if (WebGAL.gameplay.isAuto) {
          stopAuto();
        }
        return;
      }
    }

    // 触发反驳逻辑
    dispatch(setStage({ key: 'testimonyData', value: [] })); // 清空所有证言
    dispatch(setStage({ key: 'isJudgmentFastForward', value: false }));

    // 退出审判状态并停止自动播放
    dispatch(setStage({ key: 'judgment', value: '' }));
    if (WebGAL.gameplay.isAuto) {
      stopAuto();
    }

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
    <div className={styles.container}>
      <div className={styles.testimonyList}>
        {Array.isArray(testimonyDataList) &&
          testimonyDataList.map((data, idx) => (
            <TestimonyItem key={idx} data={data} onKeywordClick={handleKeywordClick} />
          ))}
      </div>
    </div>
  );
};

interface TestimonyItemProps {
  data: ITestimonyData;
  onKeywordClick: (target: string) => void;
}

const TestimonyItem: FC<TestimonyItemProps> = ({ data, onKeywordClick }) => {
  const { content, refutes, colors, pos, y } = data;

  const renderedContent = useMemo(() => {
    if (!content) return null;

    const keywords = Object.keys(refutes).sort((a, b) => b.length - a.length);
    if (keywords.length === 0) return content;

    const regex = new RegExp(`(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');

    const parts = content.split(regex);

    return parts.map((part, index) => {
      if (refutes[part]) {
        const color = colors[part] || '#FF69B4';
        return (
          <span key={index} className={styles.keyword} style={{ color }} onClick={() => onKeywordClick(refutes[part])}>
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  }, [content, refutes, colors]);

  const itemClass = `${styles.testimonyItem} ${pos ? styles[pos] : styles.center}`;

  const itemStyle: React.CSSProperties = {
    position: y !== undefined ? 'absolute' : 'relative',
    top: y !== undefined ? `${y}px` : undefined,
  };

  return (
    <div className={itemClass} style={itemStyle}>
      <div className={styles.textWrapper}>
        <div className={styles.text}>{renderedContent}</div>
      </div>
    </div>
  );
};
