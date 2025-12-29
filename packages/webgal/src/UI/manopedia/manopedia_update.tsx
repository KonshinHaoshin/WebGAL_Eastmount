import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import manopediaUpdate from '@/assets/dragonspring/manopedia/manopedia_update.png';
import styles from './manopedia_update.module.scss';
import frame from '@/assets/dragonspring/manopedia/frame.png';
import framecontainer from '@/assets/dragonspring/manopedia/frame_container.png';

// 临时使用固定物品图片，后续可以从store获取
const DEFAULT_ITEM_IMAGE = './game/Item/ansk/128x128.png';

interface ItemShowcaseProps {
    itemImageUrl: string;
    isVisible: boolean;
}

/**
 * 物品展示组件
 */
const ItemShowcase: FC<ItemShowcaseProps> = ({ itemImageUrl, isVisible }) => {
    if (!isVisible) {
        return null;
    }

    return (
        <div className={styles.itemShowcaseGroup}>
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
    const showManopediaUpdate = useSelector((state: RootState) => state.GUI.showManopediaUpdate);

    useEffect(() => {
        if (showManopediaUpdate && !isVisible) {
            setIsVisible(true);
            setIsHiding(false);
            setShowItemShowcase(true);

            const itemShowcaseTimer = setTimeout(() => {
                setShowItemShowcase(false);
            }, 3000);

            const hideTimer = setTimeout(() => {
                setIsHiding(true);
                const removeTimer = setTimeout(() => {
                    setIsVisible(false);
                }, 500);
                return () => clearTimeout(removeTimer);
            }, 4000);

            return () => {
                clearTimeout(itemShowcaseTimer);
                clearTimeout(hideTimer);
            };
        } else if (!showManopediaUpdate && isVisible) {
            setIsHiding(true);
            setShowItemShowcase(false);
            const removeTimer = setTimeout(() => {
                setIsVisible(false);
            }, 500);
            return () => clearTimeout(removeTimer);
        }
    }, [showManopediaUpdate, isVisible]);

    if (!isVisible) {
        return null;
    }

    return (
        <>
            <ItemShowcase itemImageUrl={DEFAULT_ITEM_IMAGE} isVisible={showItemShowcase} />
            <div className={`${styles.manopediaUpdateContainer} ${isHiding ? styles.hiding : ''}`}>
                <img src={manopediaUpdate} alt="Manopedia Update" className={styles.manopediaUpdateImage} />
            </div>
        </>
    );
};
