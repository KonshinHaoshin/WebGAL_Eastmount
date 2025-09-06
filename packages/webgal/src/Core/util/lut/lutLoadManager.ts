import * as PIXI from 'pixi.js';
import { loadLutTextureWithValidation } from './loadLutTextureWithValidation';

interface LUTLoadRequest {
  id: string;
  url: string;
  version: number;
  controller: AbortController;
  promise: Promise<PIXI.Texture>;
}

class LUTLoadManager {
  private activeRequests = new Map<string, LUTLoadRequest>();
  private requestCounter = 0;

  /**
   * 加载 LUT 纹理，自动取消之前的请求
   * @param id 请求标识符（如 'bg-main' 或 'fig-2'）
   * @param url LUT 文件路径
   * @param app PIXI 应用实例
   * @returns Promise<PIXI.Texture>
   */
  public async loadLUT(id: string, url: string, app: PIXI.Application): Promise<PIXI.Texture> {
    // 取消之前的请求
    this.cancelRequest(id);

    // 创建新的请求
    const version = ++this.requestCounter;
    const controller = new AbortController();

    const request: LUTLoadRequest = {
      id,
      url,
      version,
      controller,
      promise: this.createLoadPromise(url, app, controller, version)
    };

    this.activeRequests.set(id, request);

    try {
      const texture = await request.promise;

      // 检查是否仍然是最新请求
      const currentRequest = this.activeRequests.get(id);
      if (currentRequest && currentRequest.version === version) {
        console.debug(`[LUT] 成功加载 LUT: ${id} (v${version}) from ${url}`);
        return texture;
      } else {
        // 请求已被取消，销毁纹理
        texture.destroy();
        throw new Error(`[LUT] 请求已被取消: ${id} (v${version})`);
      }
    } catch (error) {
      // 检查是否仍然是最新请求
      const currentRequest = this.activeRequests.get(id);
      if (currentRequest && currentRequest.version === version) {
        // 清理失败的请求
        this.activeRequests.delete(id);
        throw error;
      } else {
        // 请求已被取消，忽略错误
        throw new Error(`[LUT] 请求已被取消: ${id} (v${version})`);
      }
    }
  }

  /**
   * 创建加载 Promise
   */
  private createLoadPromise(
    url: string,
    app: PIXI.Application,
    controller: AbortController,
    version: number
  ): Promise<PIXI.Texture> {
    return new Promise<PIXI.Texture>((resolve, reject) => {
      // 检查是否已被取消
      if (controller.signal.aborted) {
        reject(new Error(`[LUT] 请求已被取消: v${version}`));
        return;
      }

      // 监听取消信号
      controller.signal.addEventListener('abort', () => {
        reject(new Error(`[LUT] 请求已被取消: v${version}`));
      });

      // 执行实际加载
      loadLutTextureWithValidation(app, url)
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * 取消指定 ID 的请求
   */
  cancelRequest(id: string): void {
    const request = this.activeRequests.get(id);
    if (request) {
      request.controller.abort();
      this.activeRequests.delete(id);
      console.debug(`[LUT] 已取消请求: ${id} (v${request.version})`);
    }
  }

  /**
   * 取消所有请求
   */
  cancelAllRequests(): void {
    for (const [id, request] of this.activeRequests) {
      request.controller.abort();
      console.debug(`[LUT] 已取消请求: ${id} (v${request.version})`);
    }
    this.activeRequests.clear();
  }

  /**
   * 检查是否有活跃请求
   */
  hasActiveRequest(id: string): boolean {
    return this.activeRequests.has(id);
  }

  /**
   * 获取活跃请求数量
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }
}

// 导出单例实例
export const lutLoadManager = new LUTLoadManager();
