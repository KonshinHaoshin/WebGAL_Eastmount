import { useEffect, useState } from 'react';
import axios from 'axios';
import { logger } from '@/Core/util/logger';
import type { IAffectionConfig } from 'webgal-parser';

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
 * 尝试加载 game/affection 目录下的所有 JSON 文件
 * 由于浏览器限制，需要手动指定文件名列表
 * @param filenames 要加载的文件名列表（可选，默认尝试常见文件名）
 * @returns 所有好感度配置数据
 */
export function useAllAffectionData(filenames?: string[]): IAffectionConfig[] {
  const [data, setData] = useState<IAffectionConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadAllAffectionData = async () => {
      try {
        // 如果没有指定文件名，使用默认列表
        const filesToLoad = filenames || [
          'affection_test.json',
          // 可以根据实际游戏中的文件名添加更多
        ];

        const loadedData: IAffectionConfig[] = [];
        
        // 并行加载所有文件
        const loadPromises = filesToLoad.map(async (filename) => {
          try {
            const resp = await axios.get(`game/affection/${filename}`);
            const jsonData = resp.data as IAffectionConfig;
            // 验证数据格式
            if (jsonData.character && jsonData.affectionLevels) {
              return jsonData;
            } else {
              logger.warn(`好感度配置文件格式不正确: ${filename}`);
              return null;
            }
          } catch (error) {
            // 忽略单个文件加载失败（文件可能不存在）
            logger.debug(`未找到好感度配置文件: ${filename}`);
            return null;
          }
        });

        const results = await Promise.all(loadPromises);
        const validData = results.filter((item): item is IAffectionConfig => item !== null);
        
        setData(validData);
        setIsLoaded(true);
      } catch (error) {
        logger.error('加载好感度配置文件失败', error);
        setData([]);
        setIsLoaded(false);
      }
    };

    loadAllAffectionData();
  }, [filenames]);

  return data;
}

