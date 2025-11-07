import { FC, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { stageActions, addInventoryItem } from '@/store/stageReducer';
import useSoundEffect from '@/hooks/useSoundEffect';
import { itemManager } from '@/Core/Modules/item/itemManager';
import { IItemDefinition } from '@/store/IItemDefinition';
import { WebGAL } from '@/Core/WebGAL';
import styles from './itemDisplay.module.scss';

export const ItemDisplay: FC = () => {
    const dispatch = useDispatch();
    const { playSeClick } = useSoundEffect();
    const [itemDef, setItemDef] = useState<IItemDefinition | null>(null);
    const [loading, setLoading] = useState(false);

    // 从 Redux 获取当前要显示的 itemId
    const viewingItemId = useSelector((state: RootState) => state.stage.viewingItemId);
    const viewingItemCount = useSelector((state: RootState) => state.stage.viewingItemCount);
    const inventory = useSelector((state: RootState) => state.stage.inventory);

    // 获取当前物品数量
    const itemCount = viewingItemId ? inventory.items[viewingItemId]?.count ?? 0 : 0;

    useEffect(() => {
        if (viewingItemId) {
            setLoading(true);
            itemManager.loadItem(viewingItemId).then((def) => {
                setItemDef(def);
                setLoading(false);
            });
        } else {
            setItemDef(null);
        }
    }, [viewingItemId]);

    const handleClose = () => {
        dispatch(stageActions.setViewingItemId({ itemId: null }));
        playSeClick();
    };

    const handleAddToInventory = () => {
        if (viewingItemId && itemDef) {
            // 添加到仓库
            dispatch(
                addInventoryItem({
                    itemId: viewingItemId,
                    count: viewingItemCount,
                    name: itemDef.name,
                }),
            );

            // 移除舞台上的物品显示
            const key = `item-${viewingItemId}`;
            WebGAL.gameplay.pixiStage?.removeItemObjectByKey(key);

            // 关闭查看器
            dispatch(stageActions.setViewingItemId({ itemId: null }));
            playSeClick();
        }
    };

    if (!viewingItemId || !itemDef) {
        return null;
    }

    // 获取物品图片路径（itemManager 已经处理为完整路径）
    const itemImagePath = itemDef.image || '';
    // 获取物品图标路径（itemManager 已经处理为完整路径）
    const itemIconPath = itemDef.icon || '';

    return (
        <div className={styles.viewerOverlay} onClick={handleClose}>
            <div className={styles.viewerContainer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.itemInfo}>
                    {itemImagePath && <img src={itemImagePath} alt={itemDef.name} className={styles.itemImage} />}
                    <div className={styles.itemDetails}>
                        <h2 className={styles.itemName}>{itemDef.name}</h2>
                        <div className={styles.itemId}>ID: {itemDef.id}</div>
                        {itemDef.category && <div className={styles.itemCategory}>分类: {itemDef.category}</div>}
                        {itemDef.description && <div className={styles.itemDescription}>{itemDef.description}</div>}
                        <div className={styles.itemCount}>数量: {itemCount}</div>
                        <button className={styles.addButton} onClick={handleAddToInventory}>
                            {itemIconPath && <img src={itemIconPath} alt={itemDef.name} className={styles.itemIcon} />}
                            添加到仓库 (+{viewingItemCount})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
