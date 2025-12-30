import { FC, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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

// 导入游戏相关模块
import { webgalStore } from '@/store/store';
import { itemManager } from '@/Core/Modules/item/itemManager';
import { IItemDefinition } from '@/store/IItemDefinition';
import { IInventoryItem } from '@/store/stageInterface';

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
    const { playSeClick, playSeEnter } = useSoundEffect();
    const [isCloseButtonHovered, setIsCloseButtonHovered] = useState(false);
    const [hoveredButton, setHoveredButton] = useState<ButtonType>('exhibit'); // Exhibit初始为hover状态
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null); // 当前选中的物品ID
    const [items, setItems] = useState<ManopediaItem[]>([]); // 物品数据
    const [isLoading, setIsLoading] = useState(true); // 加载状态

    // 从Redux store获取库存物品
    const inventoryItems = useSelector((state: any) => state.stage.inventory.items);

    // 加载物品数据
    useEffect(() => {
        const loadItems = async () => {
            setIsLoading(true);
            try {
                // 获取所有已定义的物品
                const allItemDefinitions = itemManager.getAllItems();


                // 重新获取物品定义
                const itemDefinitions = itemManager.getAllItems();

                // 转换物品数据
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

                // 按是否已获得排序（已获得的在前）
                manopediaItems.sort((a, b) => {
                    if (a.obtained && !b.obtained) return -1;
                    if (!a.obtained && b.obtained) return 1;
                    return 0;
                });

                setItems(manopediaItems);

                // 设置默认选中的物品（第一个已获得的物品）
                const firstObtainedItem = manopediaItems.find(item => item.obtained);
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

    const handleClose = () => {
        playSeClick();
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
        setHoveredButton('exhibit'); // 鼠标离开时恢复Exhibit为hover状态
    };

    const handleButtonClick = (buttonType: ButtonType) => {
        playSeClick();
        // 这里可以添加各个按钮的点击逻辑
        console.log(`点击了按钮: ${buttonType}`);
    };

    // 处理物品点击
    const handleItemClick = (itemId: string) => {
        const item = items.find((item) => item.id === itemId);
        if (item?.obtained) {
            playSeClick();
            setSelectedItemId(itemId);
        }
    };

    // 获取当前选中的物品
    const selectedItem = items.find((item) => item.id === selectedItemId);

    // 获取已获得的物品（用于缩略图列表）
    const obtainedItems = items.filter((item) => item.obtained);

    // 如果正在加载，显示加载状态
    if (isLoading) {
        return (
            <div className={styles.manopediaOverlay} style={{ backgroundImage: `url(${manopediaBackgorund})` }}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingText}>加载物品数据中...</div>
                </div>
            </div>
        );
    }

    // 按钮配置
    const buttons: { type: ButtonType; normal: string; hover: string }[] = [
        { type: 'exhibit', normal: Exhibit, hover: ExhibitHover },
        { type: 'figure', normal: Figure, hover: FigureHover },
        { type: 'map', normal: Map, hover: MapHover },
        { type: 'rule', normal: Rule, hover: RuleHover },
        { type: 'record', normal: Record, hover: RecordHover },
    ];

    return (
        <div className={styles.manopediaOverlay} style={{ backgroundImage: `url(${manopediaBackgorund})` }}>
            {/* 有alpha通道的frame资产 - 主展示区背景 */}
            <img src={frame} alt="manopedia frame" className={styles.frameAsset} />

            {/* 主展示区 - 显示当前选中的物品大图 */}
            <div className={styles.mainDisplayArea}>
                {selectedItem?.obtained && (
                    <div className={styles.selectedItemDisplay}>
                        <img
                            src={selectedItem.image}
                            alt={selectedItem.name}
                            className={styles.itemLargeImage}
                        />
                        <div className={styles.itemInfo}>
                            <h3 className={styles.itemName}>{selectedItem.name}</h3>
                            <p className={styles.itemDescription}>{selectedItem.description}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 有alpha通道的items显示资产 - 缩略图列表背景 */}
            <img src={itemsDisplay} alt="manopedia items display" className={styles.itemsDisplayAsset} />

            {/* 缩略图列表 - 显示已获得的物品 */}
            <div className={styles.thumbnailList}>
                {obtainedItems.map((item) => (
                    <div
                        key={item.id}
                        className={`${styles.thumbnailItem} ${selectedItemId === item.id ? styles.selected : ''}`}
                        onClick={() => handleItemClick(item.id)}
                        onMouseEnter={() => playSeEnter()}
                    >
                        <img src={item.icon} alt={item.name} className={styles.thumbnailImage} />
                        {!item.obtained && <div className={styles.lockedOverlay}>未获得</div>}
                    </div>
                ))}
            </div>

            {/* 右侧五个功能按钮 */}
            <div className={styles.rightButtonsContainer} onMouseLeave={handleButtonLeave}>
                {buttons.map((button) => (
                    <div
                        key={button.type}
                        className={styles.rightButtonContainer}
                        style={{
                            order:
                                button.type === 'map'
                                    ? 3
                                    : button.type === 'exhibit'
                                        ? 1
                                        : button.type === 'figure'
                                            ? 2
                                            : button.type === 'rule'
                                                ? 4
                                                : 5,
                        }}
                    >
                        <img
                            src={hoveredButton === button.type ? button.hover : button.normal}
                            alt={button.type}
                            className={styles.rightButton}
                            onClick={() => handleButtonClick(button.type)}
                            onMouseEnter={() => handleButtonEnter(button.type)}
                        />
                    </div>
                ))}
            </div>

            {/* 关闭按钮 */}
            <div
                className={styles.closeButtonsContainer}
                onClick={handleClose}
                onMouseEnter={handleCloseButtonEnter}
                onMouseLeave={handleCloseButtonLeave}
            >
                <div
                    className={styles.closeButton}
                    style={{
                        backgroundImage: `url(${isCloseButtonHovered ? closeButtonHover : closeButton})`,
                    }}
                />
            </div>
        </div>
    );
};
