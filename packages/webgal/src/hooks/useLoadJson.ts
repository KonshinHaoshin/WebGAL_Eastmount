// 自动加载json文件
import { logger } from '@/Core/util/logger';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { WebGAL } from '@/Core/WebGAL';
export default function useLoadJson<T = any>(url: string, defaultVal: T): T {
  const [data, setData] = useState<T>(defaultVal);
  const [isLoaded, setIsLoaded] = useState(false);

  const updateJsonFile = async () => {
    try {
      logger.debug('加载json文件', url);
      const resp = await axios.get(`game/template/${url}`);
      const jsonData = resp.data;
      setData(jsonData);
      setIsLoaded(true);
    } catch (error) {
      logger.error('加载json文件失败', error);
      setData(defaultVal);
      setIsLoaded(false);
    }
  };

  useEffect(() => {
    updateJsonFile();
  }, [url]);

  // 注册更新事件
  useEffect(() => {
    const handler = () => {
      updateJsonFile();
    };
    WebGAL.events.styleUpdate.on(handler); // 复用现有的样式更新事件
    return () => WebGAL.events.styleUpdate.off(handler);
  }, [url]);

  return data;
}
