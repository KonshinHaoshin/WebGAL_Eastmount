import { FC, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { stageActions } from '@/store/stageReducer';
import useSoundEffect from '@/hooks/useSoundEffect';
import { itemManager } from '@/Core/Modules/item/itemManager';
import { IItemDefinition } from '@/store/IItemDefinition';
import styles from './inventoryViewer.module.scss';

interface IInventoryViewerProps {
  onClose: () => void;
}

export const InventoryViewer: FC<IInventoryViewerProps> = ({ onClose }) => {
  const dispatch = useDispatch();
  const { playSeClick } = useSoundEffect();
  const inventory = useSelector((state: RootState) => state.stage.inventory);
  const [itemDefinitions, setItemDefinitions] = useState<Map<string, IItemDefinition>>(new Map());

  // 加载所有物品定义
  useEffect(() => {
    const loadItemDefinitions = async () => {
      const itemIds = Object.keys(inventory.items);
      const definitions = new Map<string, IItemDefinition>();
      
      for (const itemId of itemIds) {
        const itemDef = await itemManager.loadItem(itemId);
        if (itemDef) {
          definitions.set(itemId, itemDef);
        }
      }
      
      setItemDefinitions(definitions);
    };

    loadItemDefinitions();
  }, [inventory.items]);

  // 点击物品，显示 ItemDisplay
  const handleItemClick = (itemId: string) => {
    const item = inventory.items[itemId];
    if (!item) {
      return;
    }
    // 显示 ItemDisplay，设置 count 为 1（从仓库使用时默认使用 1 个）
    dispatch(
      stageActions.setViewingItemId({
        itemId: itemId,
        count: 1,
      }),
    );
    playSeClick();
  };

  const inventoryItems = Object.values(inventory.items).filter((item) => item.count > 0);

  return (
    <div className={styles.inventoryContainer}>
      <h2 className={styles.inventoryTitle}>仓库</h2>
      <div className={styles.inventoryGrid}>
        {inventoryItems.length === 0 ? (
          <div className={styles.emptyMessage}>仓库为空</div>
        ) : (
          inventoryItems.map((item) => {
            const itemDef = itemDefinitions.get(item.id);
            if (!itemDef) {
              return null;
            }

            return (
              <div key={item.id} className={styles.inventoryItem} onClick={() => handleItemClick(item.id)}>
                {itemDef.icon && (
                  <img src={itemDef.icon} alt={itemDef.name} className={styles.itemIcon} />
                )}
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{itemDef.name}</div>
                  <div className={styles.itemCount}>数量: {item.count}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

