import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { logger } from '@/Core/util/logger';
import type { IAffectionConfig } from 'webgal-parser';
import { RootState } from '@/store/store';

/**
 * 加载好感度配置文件（单个文件）
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
 * 直接从 Redux store 中读取已加载的好感度配置数据
 * @returns 所有好感度配置数据
 */
export function useAllAffectionData(): IAffectionConfig[] {
  // 直接从 Redux store 读取已加载的好感度数据
  const affectionData = useSelector((state: RootState) => state.userData.affectionData);
  console.log('[useAllAffectionData] 从 Redux store 读取好感度数据:', affectionData);
  return affectionData;
}
