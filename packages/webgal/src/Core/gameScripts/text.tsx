import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import React from 'react';
import ReactDOM from 'react-dom';
import styles from '@/Stage/FullScreenPerform/fullScreenPerform.module.scss';
import { nextSentence } from '@/Core/controller/gamePlay/nextSentence';
import { PerformController } from '@/Core/Modules/perform/performController';
import { logger } from '@/Core/util/logger';
import { WebGAL } from '@/Core/WebGAL';
import { get, replace } from 'lodash';
import { webgalStore } from '@/store/store';
import useEscape from '@/hooks/useEscape';
import { getBooleanArgByKey, getNumberArgByKey, getStringArgByKey } from '../util/getSentenceArg';
/**
 * 显示一小段黑屏演示
 * @param sentence
 */
export const text = (sentence: ISentence): IPerform => {
    /**
     * text 内部控制
     */

    const performName = `textPerform${Math.random().toString()}`;

    const fontSizeFromArgs = getStringArgByKey(sentence, 'fontSize') ?? 'medium';
    let fontSize = '350%';
    switch (fontSizeFromArgs) {
        case 'small':
            fontSize = '280%';
            break;
        case 'medium':
            fontSize = '350%';
            break;
        case 'large':
            fontSize = '420%';
            break;
    }
    const backgroundImageFromArgs = getStringArgByKey(sentence, 'backgroundImage') ?? '';
    const backgroundImage = `url("game/background/${backgroundImageFromArgs}") center/cover no-repeat`;
    const backgroundColor = getStringArgByKey(sentence, 'backgroundColor') ?? 'rgba(0, 0, 0, 1)';
    const color = getStringArgByKey(sentence, 'fontColor') ?? 'rgba(255, 255, 255, 1)';
    const animationFromArgs = getStringArgByKey(sentence, 'animation') ?? '';
    let animationClass: any = (type: string, length = 0) => {
        switch (type) {
            case 'fadeIn':
                return styles.fadeIn;
            case 'slideIn':
                return styles.slideIn;
            case 'typingEffect':
                return `${styles.typingEffect} ${length}`;
            case 'pixelateEffect':
                return styles.pixelateEffect;
            case 'revealAnimation':
                return styles.revealAnimation;
            default:
                return styles.fadeIn;
        }
    };
    let chosenAnimationClass = animationClass(animationFromArgs);
    let delayTime = getNumberArgByKey(sentence, 'delayTime') ?? 1500;
    let isHold = getBooleanArgByKey(sentence, 'hold') ?? false;
    let isUserForward = getBooleanArgByKey(sentence, 'userForward') ?? true;
    // 设置一个很大的延迟，这样自然就看起来不自动继续了
    const animationDelayValue = 99999999;
    // 用户手动控制向前步进，所以必须是 hold
    isHold = true;

    const textContainerStyle = {
        background: backgroundImage,
        backgroundColor: backgroundColor,
        color: color,
        fontSize: fontSize || '350%',
        width: '100%',
        height: '100%',
    };
    const textArray: Array<string> = sentence.content.split(/(?<!\\)\|/).map((val: string) => useEscape(val));

    let isBlocking = true;

    const toNextTextElement = () => {
        const textContainer = document.getElementById('textContainer');
        if (textContainer) {
            const children = textContainer.childNodes[0].childNodes[0].childNodes as any;
            const len = children.length;
            let isEnd = true;
            for (const node of children) {
                // 当前语句的延迟显示时间
                const currentDelay = Number(node.style.animationDelay.split('ms')[0]);
                // 当前语句还没有显示，降低显示延迟，因为现在时间因为用户操作，相当于向前推进了
                if (currentDelay > 0) {
                    isEnd = false;
                    // 用 Animation API 操作，浏览器版本太低就无办法了
                    const nodeAnimations = node.getAnimations();
                    node.style.animationDelay = '0ms ';
                    for (const ani of nodeAnimations) {
                        ani.currentTime = 0;
                        ani.play();
                    }
                    // 只显示一行
                    break;
                }
            }
            if (isEnd) {
                isBlocking = false;
                WebGAL.gameplay.performController.unmountPerform(performName);
            }
        }
    };

    // 实时监控 auto 状态的计时器
    let accumulatedTime = 0;
    const autoControlTimer = setInterval(() => {
        if (WebGAL.gameplay.isAuto) {
            const autoSpeed = webgalStore.getState().userData.optionData.autoSpeed;
            // 计算自动播放延迟 (与 autoPlay.ts 逻辑保持一致)
            const autoPlayDelay = 250 + (100 - autoSpeed) * 15;

            accumulatedTime += 100;
            if (accumulatedTime >= autoPlayDelay) {
                accumulatedTime = 0;
                toNextTextElement();
            }
        } else {
            accumulatedTime = 0; // 非 auto 模式重置累积时间
        }
    }, 100);

    /**
     * 接受 next 事件
     */
    WebGAL.events.userInteractNext.on(toNextTextElement);

    const showText = textArray.map((e, i) => (
        <div
            key={'texttext' + i + Math.random().toString()}
            style={{ animationDelay: `${animationDelayValue}ms` }}
            className={chosenAnimationClass}
        >
            {e}
            {e === '' ? '\u00a0' : ''}
        </div>
    ));
    const textElement = (
        <div style={textContainerStyle}>
            <div style={{ padding: '3em 4em 3em 4em' }}>{showText}</div>
        </div>
    );
    // eslint-disable-next-line react/no-deprecated
    ReactDOM.render(textElement, document.getElementById('textContainer'));
    const textContainer = document.getElementById('textContainer');

    if (textContainer) {
        textContainer.style.display = 'block';
    }

    return {
        performName,
        duration: 1000 * 60 * 60 * 24,
        isHoldOn: false,
        stopFunction: () => {
            const textContainer = document.getElementById('textContainer');
            if (textContainer) {
                textContainer.style.display = 'none';
            }
            clearInterval(autoControlTimer);
            WebGAL.events.userInteractNext.off(toNextTextElement);
        },
        blockingNext: () => isBlocking,
        blockingAuto: () => isBlocking,
        stopTimeout: undefined, // 暂时不用，后面会交给自动清除
        goNextWhenOver: true,
    };
};
