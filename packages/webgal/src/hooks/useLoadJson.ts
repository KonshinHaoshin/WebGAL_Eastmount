import axios from 'axios';
import { useEffect, useState } from 'react';
import { logger } from '@/Core/util/logger';
import { WebGAL } from '@/Core/WebGAL';

/**
 * Load JSON owned by the active game template and refresh it whenever Terre
 * asks the engine to reload template assets.
 */
export default function useLoadJson<T>(url: string, defaultValue: T): T {
  const [data, setData] = useState<T>(defaultValue);

  useEffect(() => {
    let active = true;

    const updateJsonFile = async () => {
      try {
        logger.debug('加载模板 JSON', url);
        const response = await axios.get<T>(`game/template/${url}`);
        if (active) setData(response.data);
      } catch (error) {
        logger.warn(`加载模板 JSON 失败，使用默认值: ${url} (${String(error)})`);
        if (active) setData(defaultValue);
      }
    };

    void updateJsonFile();
    const handleStyleUpdate = () => void updateJsonFile();
    WebGAL.events.styleUpdate.on(handleStyleUpdate);

    return () => {
      active = false;
      WebGAL.events.styleUpdate.off(handleStyleUpdate);
    };
  }, [url]);

  return data;
}
