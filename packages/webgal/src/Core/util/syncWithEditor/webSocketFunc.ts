import { DebugCommand, IComponentVisibilityCommand, IDebugMessage } from '@/types/debugProtocol';
import { webgalStore } from '@/store/store';
import { setFontOptimization, setVisibility } from '@/store/GUIReducer';
import { WebGAL } from '@/Core/WebGAL';
import { sceneParser, WebgalParser } from '@/Core/parser/sceneParser';
import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { runScript } from '@/Core/controller/gamePlay/runScript';
import { nextSentence } from '@/Core/controller/gamePlay/nextSentence';
import { resetStage } from '@/Core/controller/stage/resetStage';
import { logger } from '@/Core/util/logger';
import { syncWithOrigine } from './syncWithOrigine';
import { stageActions } from '@/store/stageReducer';
import { baseTransform, IEffect } from '@/store/stageInterface';

export const webSocketFunc = () => {
  const loc: string = window.location.hostname;
  const protocol: string = window.location.protocol;
  const port: string = window.location.port; // èŽ·å–ç«¯å£å?
  // é»˜è®¤æƒ…å†µä¸‹ï¼Œä¸éœ€è¦åœ¨URLä¸­æ˜Žç¡®æŒ‡å®šæ ‡å‡†HTTP(80)å’ŒHTTPS(443)ç«¯å£
  let defaultPort = '';
  if (port && port !== '80' && port !== '443') {
    // å¦‚æžœå­˜åœ¨éžæ ‡å‡†ç«¯å£å·ï¼Œå°†å…¶åŒ…å«åœ¨URLä¸­
    defaultPort = `:${port}`;
  }

  if (protocol !== 'http:' && protocol !== 'https:') {
    return;
  }
  // æ ¹æ®å½“å‰åè®®æž„å»ºWebSocket URLï¼Œå¹¶åŒ…æ‹¬ç«¯å£å·ï¼ˆå¦‚æžœæœ‰ï¼‰
  let wsUrl = `ws://${loc}${defaultPort}/api/webgalsync`;
  if (protocol === 'https:') {
    wsUrl = `wss://${loc}${defaultPort}/api/webgalsync`;
  }
  logger.info(`Starting WebSocket connection at ${wsUrl}`);
  const socket = new WebSocket(wsUrl);
  socket.onopen = () => {
    logger.info('WebSocket connected');
    function sendStageSyncMessage() {
      const message: IDebugMessage = {
        event: 'message',
        data: {
          command: DebugCommand.SYNCFC,
          sceneMsg: {
            scene: WebGAL.sceneManager.sceneData.currentScene.sceneName,
            sentence: WebGAL.sceneManager.sceneData.currentSentenceId,
          },
          stageSyncMsg: webgalStore.getState().stage,
          message: 'sync',
        },
      };
      socket.send(JSON.stringify(message));
      // logger.debug('ä¼ é€ä¿¡æ?, message);
      setTimeout(sendStageSyncMessage, 1000);
    }
    sendStageSyncMessage();
  };
  socket.onmessage = (e) => {
    // logger.info('æ”¶åˆ°ä¿¡æ¯', e.data);
    const str: string = e.data;
    const data: IDebugMessage = JSON.parse(str);
    const message = data.data;
    if (message.command === DebugCommand.JUMP) {
      syncWithOrigine(message.sceneMsg.scene, message.sceneMsg.sentence, message.message === 'exp');
    }
    if (message.command === DebugCommand.EXE_COMMAND) {
      const command = message.message;
      const scene = WebgalParser.parse(command, 'temp.txt', 'temp.txt');
      scene.sentenceList.forEach((sentence: ISentence) => {
        runScript(sentence);
      });
    }
    if (message.command === DebugCommand.REFETCH_TEMPLATE_FILES) {
      const title =
        document.getElementById('Title_enter_page') ??
        (document.querySelector('.html-body__title-enter') as HTMLElement | null);
      if (title) {
        title.style.display = 'none';
      }
      WebGAL.events.styleUpdate.emit();
    }
    if (message.command === DebugCommand.SET_COMPONENT_VISIBILITY) {
      const command = message.message;
      const commandData = JSON.parse(command) as IComponentVisibilityCommand[];
      commandData.forEach((item) => {
        if (item) {
          webgalStore.dispatch(setVisibility({ component: item.component, visibility: item.visibility }));
        }
      });
    }
    if (message.command === DebugCommand.TEMP_SCENE) {
      const command = message.message;
      resetStage(true);
      WebGAL.sceneManager.sceneData.currentScene = sceneParser(command, 'temp', './temp.txt');
      webgalStore.dispatch(setVisibility({ component: 'showTitle', visibility: false }));
      webgalStore.dispatch(setVisibility({ component: 'showMenuPanel', visibility: false }));
      webgalStore.dispatch(setVisibility({ component: 'showPanicOverlay', visibility: false }));
      setTimeout(() => {
        nextSentence();
      }, 100);
    }
    if (message.command === DebugCommand.FONT_OPTIMIZATION) {
      const command = message.message;
      webgalStore.dispatch(setFontOptimization(command === 'true'));
    }
    if (message.command === DebugCommand.SET_EFFECT) {
      try {
        const effect = JSON.parse(message.message) as IEffect;
        const targetEffect = webgalStore.getState().stage.effects.find((e) => e.target === effect.target);
        const targetTransform = targetEffect?.transform ? targetEffect.transform : baseTransform;
        const newTransform = {
          ...targetTransform,
          ...(effect.transform ?? {}),
          position: {
            ...targetTransform.position,
            ...(effect.transform?.position ?? {}),
          },
          scale: {
            ...targetTransform.scale,
            ...(effect.transform?.scale ?? {}),
          },
        };
        webgalStore.dispatch(stageActions.updateEffect({ target: effect.target, transform: newTransform }));
      } catch (e) {
        logger.error(`Failed to set effect ${message.message}, ${e}`);
        return;
      }
    }
  };
  socket.onerror = () => {
    logger.info('No active editor connection');
  };
};
