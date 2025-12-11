import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { logger } from '@/Core/util/logger';
import type { IAffectionConfig } from 'webgal-parser';
import { RootState } from '@/store/store';

/**
 * 加载好感度配置文件
 * @param filename JSON 文件名（如 "affection_test.json"）
 * @returns 好感度配置数据
 */
export function useAffectionData(filename: string): IAffectionConfig | null {
  const [data, setData] = useState<IAffectionConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadAffectionData = async () => {
      try {
        logger.debug('加载好感度配置文件', filename);
        const resp = await axios.get(`game/affection/${filename}`);
        const jsonData = resp.data as IAffectionConfig;
        setData(jsonData);
        setIsLoaded(true);
      } catch (error) {
        logger.error('加载好感度配置文件失败', error);
        setData(null);
        setIsLoaded(false);
      }
    };

    if (filename) {
      loadAffectionData();
    }
  }, [filename]);

  return data;
}

/**
 * 加载所有好感度配置文件
 * 从 Redux store 中读取已通过 loadAffectionFile 命令加载的文件列表
 * @returns 所有好感度配置数据
 */
export function useAllAffectionData(): IAffectionConfig[] {
  const [data, setData] = useState<IAffectionConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  // 直接使用 useSelector，Redux Toolkit 的 Immer 会自动创建新引用
  const affectionFiles = useSelector((state: RootState) => state.userData.affectionFiles);

  useEffect(() => {
    const loadAllAffectionData = async () => {
      try {
        logger.debug('useAllAffectionData 被调用，affectionFiles:', affectionFiles);
        console.log('[useAllAffectionData] affectionFiles 变化:', affectionFiles);

        if (!affectionFiles || affectionFiles.length === 0) {
          logger.debug('未找到已加载的好感度文件列表，affectionFiles:', affectionFiles);
          setData([]);
          setIsLoaded(true);
          return;
        }

        logger.debug('从 store 加载好感度文件列表', affectionFiles);

        // 并行加载所有文件
        const loadPromises = affectionFiles.map(async (filename) => {
          try {
            // 移除路径中的 ./ 前缀（如果存在）
            // 如果 filename 已经是完整路径（如 ./game/affection/xxx.json），提取文件名
            let actualFilename = filename;
            if (filename.includes('/')) {
              // 提取文件名部分
              actualFilename = filename.split('/').pop() || filename;
            }
            // 移除可能的 ./ 前缀
            actualFilename = actualFilename.replace(/^\.\//, '');

            const url = `game/affection/${actualFilename}`;
            logger.debug(`[useAllAffectionData] 原始文件名: ${filename}, 处理后: ${actualFilename}, 请求 URL: ${url}`);
            console.log(`[useAllAffectionData] 原始文件名: ${filename}, 处理后: ${actualFilename}, 请求 URL: ${url}`);
            const resp = await axios.get(url);
            logger.debug(`[useAllAffectionData] 文件加载成功: ${filename}`, resp.data);
            console.log(`[useAllAffectionData] 文件加载成功: ${filename}`, resp.data);
            const jsonData = resp.data as IAffectionConfig;
            // 验证数据格式
            if (jsonData.character && jsonData.affectionLevels) {
              logger.debug(`成功加载好感度文件: ${filename}`);
              console.log(`[useAllAffectionData] 文件验证通过: ${filename}`, jsonData);
              return jsonData;
            } else {
              logger.warn(`好感度配置文件格式不正确: ${filename}`, jsonData);
              console.warn(`[useAllAffectionData] 文件格式验证失败: ${filename}`, jsonData);
              return null;
            }
          } catch (error: any) {
            logger.error(`加载好感度配置文件失败: ${filename}`, error);
            console.error(`[useAllAffectionData] 加载文件失败: ${filename}`, error);
            if (error.response) {
              console.error(`[useAllAffectionData] 响应状态: ${error.response.status}`, error.response.data);
            }
            return null;
          }
        });

        const results = await Promise.all(loadPromises);
        const validData = results.filter((item): item is IAffectionConfig => item !== null);

        logger.debug(`共加载 ${validData.length} 个好感度配置文件`);
        console.log('[useAllAffectionData] 设置数据:', validData);
        setData(validData);
        setIsLoaded(true);
      } catch (error) {
        logger.error('加载好感度配置文件失败', error);
        setData([]);
        setIsLoaded(false);
      }
    };

    loadAllAffectionData();
  }, [affectionFiles]);

  return data;
}
