import { FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getValueFromState } from '@/Core/gameScripts/setVar';
import { useAllAffectionData } from '@/hooks/useAffectionData';
import useSoundEffect from '@/hooks/useSoundEffect';
import styles from './affectionViewer.module.scss';

/**
 * 好感度查看器组件
 * 直接从游戏变量系统读取好感度值，支持：
 * - 普通变量（跟随存档）：stage.GameVar
 * - 全局变量（长效变量，使用 -global 参数设置）：userData.globalGameVar
 */
export const AffectionViewer: FC = () => {
  const affectionConfigs = useAllAffectionData();
  // 订阅 store 变化，确保变量更新时组件重新渲染
  const stageGameVar = useSelector((state: RootState) => state.stage.GameVar);
  const globalGameVar = useSelector((state: RootState) => state.userData.globalGameVar);
  const { playSeClick, playSeEnter } = useSoundEffect();
  
  // 分页状态：每页显示一个角色
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = affectionConfigs.length;

  // 计算每个角色的好感度值和等级
  const affectionData = useMemo(() => {
    return affectionConfigs.map((config) => {
      const varName = config.character.affectionVarName;
      // 直接从游戏变量系统中获取好感度值
      // getValueFromState 会自动检查 stage.GameVar 和 userData.globalGameVar
      // 支持普通变量（跟随存档）和全局变量（使用 -global 参数设置）
      const value = getValueFromState(varName);
      const affectionValue: number = typeof value === 'number' ? value : 0;

      // 找到当前好感度等级
      const currentLevel =
        config.affectionLevels.find((level) => affectionValue >= level.minValue && affectionValue <= level.maxValue) ||
        config.affectionLevels[0];

      // 计算进度百分比（在当前等级内的进度）
      const levelProgress = currentLevel
        ? Math.max(
          0,
          Math.min(
            100,
            ((affectionValue - currentLevel.minValue) / (currentLevel.maxValue - currentLevel.minValue)) * 100,
          ),
        )
        : 0;

      // 收集所有已解锁的信息（累积显示所有达到的等级）
      const allUnlockedInfo: Array<{ id: string; title: string; content: string }> = [];
      config.affectionLevels.forEach((level) => {
        // 如果好感度达到了这个等级的最小值，就解锁该等级的信息
        if (affectionValue >= level.minValue && level.unlocked.info) {
          allUnlockedInfo.push(...level.unlocked.info);
        }
      });

      return {
        config,
        affectionValue,
        currentLevel,
        levelProgress,
        allUnlockedInfo,
      };
    });
  }, [affectionConfigs, stageGameVar, globalGameVar]);

  if (affectionData.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>暂无好感度数据</p>
      </div>
    );
  }

  // 获取当前页的角色数据
  const currentCharacterData = affectionData[currentPage - 1];

  // 处理上一页
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      playSeClick();
    }
  };

  // 处理下一页
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      playSeClick();
    }
  };

  return (
    <div className={styles.affectionViewer}>
      <div className={styles.characterList}>
        {currentCharacterData && (
          <div key={currentCharacterData.config.character.id} className={styles.characterCard}>
            {/* 左侧头像区域 */}
            <div className={styles.avatarSection}>
              {currentCharacterData.config.character.avatar && (
                <img
                  src={currentCharacterData.config.character.avatar}
                  alt={currentCharacterData.config.character.name}
                  className={styles.avatar}
                />
              )}
            </div>

            {/* 右侧信息区域 */}
            <div className={styles.infoSection}>
              {/* 角色名称 */}
              <h3 className={styles.characterName}>{currentCharacterData.config.character.name}</h3>

              {/* 角色描述 */}
              <p className={styles.characterDescription}>{currentCharacterData.config.character.description}</p>

              {/* 好感度数值 */}
              <div className={styles.affectionValue}>
                <span className={styles.valueLabel}>好感度：</span>
                <span className={styles.valueNumber}>{currentCharacterData.affectionValue}</span>
              </div>

              {/* 等级信息 */}
              <div className={styles.levelInfo}>
                <span className={styles.levelName}>{currentCharacterData.currentLevel?.levelName}</span>
                <span className={styles.levelDescription}>{currentCharacterData.currentLevel?.description}</span>
              </div>

              {/* 进度条 */}
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.min(100, Math.max(0, currentCharacterData.levelProgress))}%` }}
                  />
                </div>
                <div className={styles.progressText}>
                  {currentCharacterData.currentLevel?.minValue} / {currentCharacterData.currentLevel?.maxValue}
                </div>
              </div>

              {/* 已解锁信息 - 显示所有已解锁的信息 */}
              {currentCharacterData.allUnlockedInfo && currentCharacterData.allUnlockedInfo.length > 0 && (
                <div className={styles.unlockedInfo}>
                  <h4 className={styles.unlockedTitle}>已解锁信息</h4>
                  {currentCharacterData.allUnlockedInfo.map((info) => (
                    <div key={info.id} className={styles.infoItem}>
                      <h5 className={styles.infoTitle}>{info.title}</h5>
                      <p className={styles.infoContent}>{info.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 分页按钮 - 只在有多个角色时显示 */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={`${styles.pageButton} ${currentPage === 1 ? styles.pageButtonDisabled : ''}`}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              onMouseEnter={playSeEnter}
            >
              ← 上一页
            </button>
            <div className={styles.pageInfo}>
              {currentPage} / {totalPages}
            </div>
            <button
              className={`${styles.pageButton} ${currentPage === totalPages ? styles.pageButtonDisabled : ''}`}
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              onMouseEnter={playSeEnter}
            >
              下一页 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
