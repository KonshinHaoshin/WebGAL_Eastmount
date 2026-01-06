import React, { FC, useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useSoundEffect from '@/hooks/useSoundEffect';
import styles from './manopedia.module.scss';
import manopediaBackgorund from '@/assets/dragonspring/manopedia/manopedia.png';
import closeButton from '@/assets/dragonspring/manopedia/closeButton.png';
import closeButtonHover from '@/assets/dragonspring/manopedia/closeButton_hover.png';

// 5个功能按钮
import Exhibit from '@/assets/dragonspring/manopedia/Exhibit.png';
import ExhibitHover from '@/assets/dragonspring/manopedia/Exhibit_on.png';
import Figure from '@/assets/dragonspring/manopedia/Figure.png';
import FigureHover from '@/assets/dragonspring/manopedia/Figure_on.png';
import Map from '@/assets/dragonspring/manopedia/Map.png';
import MapHover from '@/assets/dragonspring/manopedia/Map_on.png';
import Rule from '@/assets/dragonspring/manopedia/Rule.png';
import RuleHover from '@/assets/dragonspring/manopedia/Rule_on.png';
import Record from '@/assets/dragonspring/manopedia/Record.png';
import RecordHover from '@/assets/dragonspring/manopedia/Record_on.png';
// frame和items
import frame from '@/assets/dragonspring/manopedia/manopedia_frame.png';
import itemsDisplay from '@/assets/dragonspring/manopedia/manopedia_items.png';

import nameContainer from '@/assets/dragonspring/manopedia/nameContainer.png';

// 出示证据相关图片
import presentTheEvidence_button from '@/assets/dragonspring/manopedia/presentTheEvidence_button.png';
import presentTheEvidence_hover from '@/assets/dragonspring/manopedia/presentTheEvidence_hover.png';
import presentTheEvidence_text from '@/assets/dragonspring/manopedia/presentTheEvidence_text.png';

// 导入游戏相关模块
import { itemManager } from '@/Core/Modules/item/itemManager';
import { IItemDefinition } from '@/store/IItemDefinition';
import { setStage } from '@/store/stageReducer';
import { WebGAL } from '@/Core/WebGAL';
import { changeScene } from '@/Core/controller/scene/changeScene';

// 导入证据确认对话框
import { showEvidenceConfirmDialog, hideEvidenceConfirmDialog } from '@/UI/EvidenceConfirmDialog/EvidenceConfirmDialog';

// 物品数据接口（扩展游戏物品定义）
interface ManopediaItem extends IItemDefinition {
  obtained: boolean; // 是否已获得
  count: number; // 物品数量
}

interface ManopediaProps {
  onClose: () => void;
}

type ButtonType = 'exhibit' | 'figure' | 'map' | 'rule' | 'record';

/**
 * 魔女图鉴界面组件 - 显示物品展示和五个功能按钮
 */
export const Manopedia: FC<ManopediaProps> = ({ onClose }) => {
  const { playSeClick, playSeEnter, playSeCloseManopedia, playSePediaChoose } = useSoundEffect();
  const [isCloseButtonHovered, setIsCloseButtonHovered] = useState(false);
  const [activeButton, setActiveButton] = useState<ButtonType>('exhibit'); // 当前激活的按钮
  const [hoveredButton, setHoveredButton] = useState<ButtonType | null>(null); // 当前hover的按钮
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null); // 当前选中的物品ID
  const [items, setItems] = useState<ManopediaItem[]>([]); // 物品数据
  const [isLoading, setIsLoading] = useState(true); // 加载状态
  const [isEvidenceButtonHovered, setIsEvidenceButtonHovered] = useState(false); // 出示按钮hover状态

  const dispatch = useDispatch();

  // 从Redux store获取库存物品
  const inventoryItems = useSelector((state: any) => state.stage.inventory.items);
  // 从Redux store获取证据模式状态
  const isEvidenceMode = useSelector((state: any) => state.stage.isEvidenceMode);
  const evidenceTarget = useSelector((state: any) => state.stage.evidenceTarget);
  const evidenceJumpScenes = useSelector((state: any) => state.stage.evidenceJumpScenes);

  // 加载物品数据
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        const itemDefinitions = itemManager.getAllItems();
        const manopediaItems: ManopediaItem[] = itemDefinitions.map((itemDef) => {
          const inventoryItem = inventoryItems[itemDef.id];
          const obtained = !!inventoryItem && inventoryItem.count > 0;
          return {
            ...itemDef,
            obtained,
            count: inventoryItem?.count || 0,
            description: itemDef.description || '暂无描述',
          };
        });

        manopediaItems.sort((a, b) => {
          if (a.obtained && !b.obtained) return -1;
          if (!a.obtained && b.obtained) return 1;
          return 0;
        });

        setItems(manopediaItems);

        const firstObtainedItem = manopediaItems.find((item) => item.obtained);
        if (firstObtainedItem) {
          setSelectedItemId(firstObtainedItem.id);
        }
      } catch (error) {
        console.error('加载物品数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadItems();
  }, [inventoryItems]);

  const obtainedItems = useMemo(() => items.filter((item) => item.obtained), [items]);
  const selectedItem = useMemo(() => items.find((item) => item.id === selectedItemId), [items, selectedItemId]);

  const handleClose = () => {
    playSeCloseManopedia();
    onClose();
  };

  const handleCloseButtonEnter = () => {
    setIsCloseButtonHovered(true);
    playSeEnter();
  };

  const handleCloseButtonLeave = () => {
    setIsCloseButtonHovered(false);
  };

  const handleButtonEnter = (buttonType: ButtonType) => {
    setHoveredButton(buttonType);
    playSeEnter();
  };

  const handleButtonLeave = () => {
    setHoveredButton(null);
  };

  const handleButtonClick = (buttonType: ButtonType) => {
    playSePediaChoose();
    setActiveButton(buttonType);
  };

  const handleItemClick = (itemId: string) => {
    const item = items.find((item) => item.id === itemId);
    if (item?.obtained) {
      setSelectedItemId(itemId);
    }
  };

  const handlePresentClick = () => {
    if (!selectedItemId) return;

    // 显示确认对话框
    showEvidenceConfirmDialog({
      title: '确定要提交此项证据吗？',
      leftText: '返回',
      rightText: '是',
      leftFunc: () => {
        // 用户点击返回，不做任何操作
        console.log('用户取消了出示证据');
      },
      rightFunc: () => {
        // 用户确认出示证据
        executePresentEvidence();
      },
      onClose: () => {
        // 对话框关闭时的回调
        hideEvidenceConfirmDialog();
      },
    });
  };

  const executePresentEvidence = () => {
    if (!selectedItemId) return;

    const isCorrect = selectedItemId === evidenceTarget;
    const successScene = evidenceJumpScenes[0];
    const failScene = evidenceJumpScenes[1];

    console.log('Present Evidence:', { selectedItemId, evidenceTarget, isCorrect, successScene, failScene });

    // 1. 如果有跳转需求，先执行跳转
    if (isCorrect && successScene) {
      console.log('Jumping to success scene:', successScene);
      changeScene(successScene, successScene);
    } else if (!isCorrect && failScene) {
      console.log('Jumping to fail scene:', failScene);
      changeScene(failScene, failScene);
    }

    // 2. 无论是否跳转，都关闭图鉴 UI
    onClose();

    // 3. 最后卸载阻塞演出，使用 force 确保卸载成功
    WebGAL.gameplay.performController.unmountPerform('presentTheEvidence', true);
  };

  const formatDescription = (text: string | undefined) => {
    if (!text) return '暂无描述';
    const lines = text.split('\n');
    return lines.map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const buttons: { type: ButtonType; normal: string; hover: string }[] = [
    { type: 'exhibit', normal: Exhibit, hover: ExhibitHover },
    { type: 'figure', normal: Figure, hover: FigureHover },
    { type: 'map', normal: Map, hover: MapHover },
    { type: 'rule', normal: Rule, hover: RuleHover },
    { type: 'record', normal: Record, hover: RecordHover },
  ];

  const buttonOrder: Record<ButtonType, number> = {
    exhibit: 1,
    figure: 2,
    map: 3,
    rule: 4,
    record: 5,
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.manopediaOverlay} style={{ backgroundImage: `url(${manopediaBackgorund})` }}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingText}>加载物品数据中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.manopediaOverlay} style={{ backgroundImage: `url(${manopediaBackgorund})` }}>
      <div className={styles.frameContainer}>
        <img src={frame} alt="manopedia frame" className={styles.frameAsset} />
        <div className={styles.mainDisplayArea}>
          {selectedItem?.obtained && (
            <div className={styles.selectedItemDisplay}>
              <img src={selectedItem.image} alt={selectedItem.name} className={styles.itemLargeImage} />
              {isEvidenceMode && (
                <div
                  className={styles.evidenceButtonContainer}
                  onMouseEnter={() => {
                    setIsEvidenceButtonHovered(true);
                    playSeEnter();
                  }}
                  onMouseLeave={() => setIsEvidenceButtonHovered(false)}
                  onClick={handlePresentClick}
                >
                  <img src={presentTheEvidence_button} alt="present button" className={styles.evidenceButtonBase} />
                  <img
                    src={presentTheEvidence_hover}
                    alt="present hover"
                    className={`${styles.evidenceButtonHover} ${isEvidenceButtonHovered ? styles.visible : ''}`}
                  />
                  <img src={presentTheEvidence_text} alt="present text" className={styles.evidenceButtonText} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedItem?.obtained && (
        <div className={styles.nameContainerWrapper}>
          <img src={nameContainer} alt="Name Container" className={styles.nameContainerImage} />
          <div className={styles.nameContainerContent}>
            <div className={styles.itemName}>
              {selectedItem.name && selectedItem.name.length > 0 && (
                <>
                  <span className={styles.firstCharacter}>{selectedItem.name.charAt(0)}</span>
                  <span className={styles.restCharacters}>{selectedItem.name.slice(1)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedItem?.obtained && (
        <div className={styles.descriptionContainerWrapper}>
          <div className={styles.descriptionContainerContent}>
            <div className={styles.itemDescription}>{formatDescription(selectedItem.description)}</div>
          </div>
        </div>
      )}

      <img src={itemsDisplay} alt="manopedia items display" className={styles.itemsDisplayAsset} />

      <div className={styles.thumbnailList}>
        {obtainedItems.map((item) => (
          <div
            key={item.id}
            className={`${styles.thumbnailItem} ${selectedItemId === item.id ? styles.selected : ''}`}
            onClick={() => handleItemClick(item.id)}
            onMouseEnter={() => playSeEnter()}
          >
            <img src={item.image} alt={item.name} className={styles.thumbnailImage} />
          </div>
        ))}
      </div>

      <div className={styles.rightButtonsContainer}>
        {buttons.map((button) => (
          <div key={button.type} className={styles.rightButtonContainer} style={{ order: buttonOrder[button.type] }}>
            <img
              src={hoveredButton === button.type || activeButton === button.type ? button.hover : button.normal}
              alt={button.type}
              className={styles.rightButton}
              onClick={() => handleButtonClick(button.type)}
              onMouseEnter={() => handleButtonEnter(button.type)}
              onMouseLeave={handleButtonLeave}
            />
          </div>
        ))}
      </div>

      <div
        className={styles.closeButtonsContainer}
        onClick={handleClose}
        onMouseEnter={handleCloseButtonEnter}
        onMouseLeave={handleCloseButtonLeave}
      >
        <div
          className={styles.closeButton}
          style={{ backgroundImage: `url(${isCloseButtonHovered ? closeButtonHover : closeButton})` }}
        />
      </div>
    </div>
  );
};
