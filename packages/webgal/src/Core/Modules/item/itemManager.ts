import { logger } from '@/Core/util/logger';
import { IItemDefinition } from '@/store/IItemDefinition';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';

/**
 * 物品管理器
 */
export class ItemManager {
  private items: Map<string, IItemDefinition> = new Map();

  /**
   * 加载物品定义
   */
  async loadItem(itemId: string): Promise<IItemDefinition | null> {
    try {
      // 直接构建路径（注意：目录名是 Item，文件名是 {itemId}.json）
      const itemPath = `./game/Item/${itemId}/${itemId}.json`;
      const response = await fetch(itemPath);
      if (!response.ok) {
        logger.warn(`无法加载物品 ${itemId} 的定义文件`);
        return null;
      }
      const itemDef: IItemDefinition = await response.json();
      
      // 验证物品ID与文件夹名一致
      if (itemDef.id !== itemId) {
        logger.warn(`物品ID ${itemDef.id} 与文件夹名 ${itemId} 不一致`);
        itemDef.id = itemId; // 自动修正
      }
      
      // 处理图标和图片路径（相对于物品文件夹）
      // 直接构建路径，因为 assetSetter 没有 item 类型
      const itemBasePath = `./game/Item/${itemId}/`;
      itemDef.icon = itemDef.icon.startsWith('http') ? itemDef.icon : itemBasePath + itemDef.icon;
      itemDef.image = itemDef.image.startsWith('http') ? itemDef.image : itemBasePath + itemDef.image;
      
      this.items.set(itemDef.id, itemDef);
      logger.info(`加载物品: ${itemDef.name} (${itemDef.id})`);
      return itemDef;
    } catch (error) {
      logger.error(`加载物品 ${itemId} 失败:`, error);
      return null;
    }
  }

  /**
   * 获取物品定义
   */
  getItem(itemId: string): IItemDefinition | undefined {
    return this.items.get(itemId);
  }

  /**
   * 获取所有物品
   */
  getAllItems(): IItemDefinition[] {
    return Array.from(this.items.values());
  }

  /**
   * 检查物品是否存在
   */
  hasItem(itemId: string): boolean {
    return this.items.has(itemId);
  }
}

export const itemManager = new ItemManager();

