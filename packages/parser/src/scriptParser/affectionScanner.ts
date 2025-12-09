import { IAsset } from '../interface/sceneInterface';
import { fileType } from '../interface/assets';

/**
 * 好感度系统 JSON 文件接口
 */
export interface IAffectionConfig {
  character: {
    id: string;
    name: string;
    description: string;
    avatar: string;
    affectionVarName: string;
  };
  affectionLevels: Array<{
    level: number;
    minValue: number;
    maxValue: number;
    levelName: string;
    description: string;
    unlocked: {
      info?: Array<{
        id: string;
        title: string;
        content: string;
      }>;
    };
  }>;
  metadata?: {
    version?: string;
    lastUpdated?: string;
  };
}

/**
 * 扫描场景中可能引用的好感度系统资源
 * 只扫描角色头像
 * @param affectionConfigs 好感度配置文件列表
 * @return {Array<IAsset>} 扫描到的资源列表
 */
export const scanAffectionAssets = (
  affectionConfigs: IAffectionConfig[],
): Array<IAsset> => {
  const returnAssetsList: Array<IAsset> = [];

  affectionConfigs.forEach((config) => {
    // 扫描角色头像
    if (config.character.avatar) {
      returnAssetsList.push({
        name: config.character.avatar,
        url: config.character.avatar,
        lineNumber: 0,
        type: fileType.figure,
      });
    }
  });

  return returnAssetsList;
};


