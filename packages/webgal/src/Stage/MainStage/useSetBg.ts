import { IStageState } from '@/store/stageInterface';
import { useEffect } from 'react';
import { logger } from '@/Core/util/logger';
import { IStageObject } from '@/Core/controller/stage/pixi/PixiController';
import { setEbg } from '@/Core/gameScripts/changeBg/setEbg';

import { getEnterExitAnimation } from '@/Core/Modules/animationFunctions';
import { WebGAL } from '@/Core/WebGAL';
import { lutLoadManager } from '@/Core/util/lut/lutLoadManager';

export function useSetBg(stageState: IStageState) {
	const bgName = stageState.bgName;

	/**
	 * 设置背景
	 */
	useEffect(() => {
		const thisBgKey = 'bg-main';
		if (bgName !== '') {
			const currentBg = WebGAL.gameplay.pixiStage?.getStageObjByKey(thisBgKey);
			if (currentBg) {
				if (currentBg.sourceUrl !== bgName) {
					removeBg(currentBg);
				}
			}
			addBg(undefined, thisBgKey, bgName);
			setEbg(bgName);
			logger.debug('重设背景');
			const { duration, animation } = getEnterExitAnimation('bg-main', 'enter', true);
			WebGAL.gameplay.pixiStage!.registerPresetAnimation(animation, 'bg-main-softin', thisBgKey, stageState.effects);
			setTimeout(() => WebGAL.gameplay.pixiStage!.removeAnimationWithSetEffects('bg-main-softin'), duration);
		} else {
			const currentBg = WebGAL.gameplay.pixiStage?.getStageObjByKey(thisBgKey);
			if (currentBg) {
				removeBg(currentBg);
			}
		}
	}, [bgName]);

	// 应用背景 LUT
	useEffect(() => {
		const lutUrl = stageState.bgLut;
		const bgObj = WebGAL.gameplay.pixiStage?.getStageObjByKey('bg-main');
		if (!bgObj) return;

		if (!lutUrl) {
			// 清除 LUT
			lutLoadManager.cancelRequest('bg-main');
			bgObj.pixiContainer.setColorMapTexture(null);
			return;
		}

		// 使用 LUT 加载管理器，防止竞态条件
		(async () => {
			try {
				const app = WebGAL.gameplay.pixiStage!.currentApp!;
				const texture = await lutLoadManager.loadLUT('bg-main', lutUrl, app);
				bgObj.pixiContainer.setColorMapTexture(texture);
				bgObj.pixiContainer.colorMapIntensity = 1;
			} catch (e: unknown) {
				// 忽略已取消的请求错误
				if (e instanceof Error && !e.message.includes('请求已被取消')) {
					console.error('Failed to apply bg LUT', lutUrl, e);
				}
			}
		})();
	}, [stageState.bgLut, stageState.bgName]);

	// 组件卸载时清理
	useEffect(() => {
		return () => {
			lutLoadManager.cancelRequest('bg-main');
		};
	}, []);
}

function removeBg(bgObject: IStageObject) {
	WebGAL.gameplay.pixiStage?.removeAnimationWithSetEffects('bg-main-softin');
	const oldBgKey = bgObject.key;
	bgObject.key = 'bg-main-off' + String(new Date().getTime());
	const bgKey = bgObject.key;
	const bgAniKey = bgObject.key + '-softoff';
	WebGAL.gameplay.pixiStage?.removeStageObjectByKey(oldBgKey);
	const { duration, animation } = getEnterExitAnimation('bg-main-off', 'exit', true, bgKey);
	WebGAL.gameplay.pixiStage!.registerAnimation(animation, bgAniKey, bgKey);
	setTimeout(() => {
		WebGAL.gameplay.pixiStage?.removeAnimation(bgAniKey);
		WebGAL.gameplay.pixiStage?.removeStageObjectByKey(bgKey);
	}, duration);
}

function addBg(type?: 'image' | 'spine', ...args: any[]) {
	const url: string = args[1];
	if (['mp4', 'webm', 'mkv'].some((e) => url.toLocaleLowerCase().endsWith(e))) {
		// @ts-ignore
		return WebGAL.gameplay.pixiStage?.addVideoBg(...args);
	} else if (url.toLocaleLowerCase().endsWith('.skel')) {
		// @ts-ignore
		return WebGAL.gameplay.pixiStage?.addSpineBg(...args);
	} else {
		// @ts-ignore
		return WebGAL.gameplay.pixiStage?.addBg(...args);
	}
}
