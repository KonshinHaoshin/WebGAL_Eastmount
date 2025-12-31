import { FC, useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import manopediaUpdate from '@/assets/dragonspring/manopedia/manopedia_update.png';
import styles from './manopedia_update.module.scss';
import frame from '@/assets/dragonspring/manopedia/frame.png';
import framecontainer from '@/assets/dragonspring/manopedia/frame_container.png';

// 队列项接口
interface QueueItem {
    id: string;
    itemImage: string;
    timestamp: number;
}

interface ItemShowcaseProps {
    itemImageUrl: string;
    isVisible: boolean;
    itemId: string;
}

/**
 * 物品展示组件
 */
const ItemShowcase: FC<ItemShowcaseProps> = ({ itemImageUrl, isVisible, itemId }) => {
    if (!isVisible) {
        return null;
    }

    return (
        <div key={itemId} className={styles.itemShowcaseGroup}>
            <div className={styles.itemShowcaseContainer}>
                <img src={framecontainer} alt="Frame Container" className={styles.framecontainer} />
                <div className={styles.itemImageContainer}>
                    <img src={itemImageUrl} alt="Item" className={styles.itemImage} />
                </div>
                <img src={frame} alt="Frame" className={styles.frame} />
            </div>
        </div>
    );
};

/**
 * 魔女图鉴更新提示组件
 * 当添加新物品时显示提示
 */
export const ManopediaUpdate: FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const [showItemShowcase, setShowItemShowcase] = useState(false);
    const [currentItemImage, setCurrentItemImage] = useState<string>('');
    const [currentItemId, setCurrentItemId] = useState<string>('');
    const showManopediaUpdate = useSelector((state: RootState) => state.GUI.showManopediaUpdate);
    const manopediaUpdateItem = useSelector((state: RootState) => state.GUI.manopediaUpdateItem);

    // 物品队列
    const queueRef = useRef<QueueItem[]>([]);
    const isProcessingRef = useRef<boolean>(false);

    // 定时器引用
    const timersRef = useRef<{
        itemShowcaseTimer: ReturnType<typeof setTimeout> | null;
        hideTimer: ReturnType<typeof setTimeout> | null;
        removeTimer: ReturnType<typeof setTimeout> | null;
    }>({
        itemShowcaseTimer: null,
        hideTimer: null,
        removeTimer: null,
    });

    // 清除所有定时器
    const clearAllTimers = () => {
        if (timersRef.current.itemShowcaseTimer) {
            clearTimeout(timersRef.current.itemShowcaseTimer);
            timersRef.current.itemShowcaseTimer = null;
        }
        if (timersRef.current.hideTimer) {
            clearTimeout(timersRef.current.hideTimer);
            timersRef.current.hideTimer = null;
        }
        if (timersRef.current.removeTimer) {
            clearTimeout(timersRef.current.removeTimer);
            timersRef.current.removeTimer = null;
        }
    };

    // 添加物品到队列
    const addToQueue = (itemId: string, itemImage: string) => {
        const newItem: QueueItem = {
            id: itemId,
            itemImage,
            timestamp: Date.now(),
        };

        queueRef.current.push(newItem);

        // 如果当前没有在处理队列，开始处理
        if (!isProcessingRef.current) {
            processQueue();
        } else {
            // 如果正在处理，重置并重新播放动画
            resetAndRestartAnimation();
        }
    };

    // 处理队列
    const processQueue = () => {
        if (queueRef.current.length === 0) {
            isProcessingRef.current = false;
            return;
        }

        isProcessingRef.current = true;

        // 获取队列中的第一个物品
        const nextItem = queueRef.current[0];

        // 设置当前显示的物品
        setCurrentItemId(nextItem.id);
        setCurrentItemImage(nextItem.itemImage);

        // 开始展示动画
        startShowcaseAnimation();
    };

    // 从队列中移除当前物品
    const removeCurrentFromQueue = () => {
        if (queueRef.current.length > 0) {
            queueRef.current.shift();
        }
    };

    // 重置并重新播放动画（当有新物品加入时调用）
    const resetAndRestartAnimation = () => {
        clearAllTimers();

        // 如果有物品正在展示，重新开始整个动画
        if (isProcessingRef.current && queueRef.current.length > 0) {
            // 获取最新的物品（队列中的最后一个）
            const latestItem = queueRef.current[queueRef.current.length - 1];

            // 更新当前显示的物品为最新的
            setCurrentItemId(latestItem.id);
            setCurrentItemImage(latestItem.itemImage);

            // 重新开始展示动画
            startShowcaseAnimation();
        }
    };

    // 开始展示动画
    const startShowcaseAnimation = () => {
        clearAllTimers();

        // 先隐藏，然后立即显示以触发动画重新播放
        setShowItemShowcase(false);
        setIsHiding(false);

        // 使用setTimeout确保DOM更新后再显示，这样动画会重新开始
        setTimeout(() => {
          setShowItemShowcase(true);
          setIsVisible(true);
      }, 10);

        // 设置物品展示3秒后隐藏（动画持续时间）
        timersRef.current.itemShowcaseTimer = setTimeout(() => {
            setShowItemShowcase(false);
        }, 3000);

        // 设置整体提示4秒后开始隐藏
        timersRef.current.hideTimer = setTimeout(() => {
            setIsHiding(true);
          timersRef.current.removeTimer = setTimeout(() => {
              setIsVisible(false);
            // 当前物品展示完成，处理下一个
            removeCurrentFromQueue();
            setTimeout(() => {
                processQueue();
            }, 100);
        }, 500);
      }, 4000);
    };

    useEffect(() => {
        if (showManopediaUpdate && manopediaUpdateItem) {
            // 如果有新的物品添加，添加到队列
            const itemId = manopediaUpdateItem.itemId || `item-${Date.now()}`;
            const itemImage = manopediaUpdateItem.itemImage || './game/Item/ansk/128x128.png';

            addToQueue(itemId, itemImage);
        } else if (!showManopediaUpdate && isVisible) {
            // 如果状态变为false但组件还可见，开始隐藏动画
            setIsHiding(true);
            setShowItemShowcase(false);
            clearAllTimers();

            timersRef.current.removeTimer = setTimeout(() => {
                setIsVisible(false);
            }, 500);
        }

        // 清理函数
        return () => {
            clearAllTimers();
        };
    }, [showManopediaUpdate, manopediaUpdateItem]);

    if (!isVisible) {
        return null;
    }

    return (
        <>
            <ItemShowcase
                itemImageUrl={currentItemImage}
                isVisible={showItemShowcase}
                itemId={currentItemId}
            />
            <div className={`${styles.manopediaUpdateContainer} ${isHiding ? styles.hiding : ''}`}>
                <img src={manopediaUpdate} alt="Manopedia Update" className={styles.manopediaUpdateImage} />
            </div>
        </>
    );
};
