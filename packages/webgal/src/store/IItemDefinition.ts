// 物品定义接口
export interface IItemDefinition {
  id: string; // 物品ID（必须与文件夹名一致并且唯一）
  name: string; // 物品名称
  description?: string; // 物品描述
  image: string; // 在stage中的图片
  icon: string; // 在仓库中的图标
  category: string; // 物品分类
  allowMultiple?: boolean; // 是否可以多个 默认false
  effects?: string[]; // 物品效果,使用webgal语句
  maxStack?: number; // 最大堆叠数量 默认999
  consumable?: boolean; // 是否可消耗 默认true
}
