import React, { FC } from 'react';
import styles from './stage.module.scss';
import { TextBox } from './TextBox/TextBox';
import { AudioContainer } from './AudioContainer/AudioContainer';
import { FullScreenPerform } from './FullScreenPerform/FullScreenPerform';
import { nextSentence } from '@/Core/controller/gamePlay/nextSentence';
import { stopAll } from '@/Core/controller/gamePlay/fastSkip';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setVisibility } from '@/store/GUIReducer';
import { TextBoxFilm } from '@/Stage/TextBox/TextBoxFilm';
import { useHotkey } from '@/hooks/useHotkey';
import { MainStage } from '@/Stage/MainStage/MainStage';
import IntroContainer from '@/Stage/introContainer/IntroContainer';
import { isIOS } from '@/Core/initializeScript';
import { WebGAL } from '@/Core/WebGAL';
import { IGuiState } from '@/store/guiInterface';
import { IStageState } from '@/store/stageInterface';

function inTextBox(event: React.MouseEvent) {
  const tb = document.getElementById('textBoxMain');
  if (!tb) {
    return false;
  }
  const bounds = tb.getBoundingClientRect();
  return (
    event.clientX > bounds.left &&
    event.clientX < bounds.right &&
    event.clientY > bounds.top &&
    event.clientY < bounds.bottom
  );
}

function checkMousePosition(event: React.MouseEvent, GUIState: IGuiState, dispatch: ReturnType<typeof useDispatch>) {
  if (!GUIState.controlsVisibility && inTextBox(event)) {
    dispatch(setVisibility({ component: 'controlsVisibility', visibility: true }));
  }
  if (GUIState.controlsVisibility && !inTextBox(event)) {
    dispatch(setVisibility({ component: 'controlsVisibility', visibility: false }));
  }
}

function isTextboxHidden(stageState: IStageState, GUIState: IGuiState) {
  if (!GUIState.showTextBox) {
    return true;
  }

  if (stageState.isDisableTextbox) {
    return true;
  }

  const isText = stageState.showText !== '' || stageState.showName !== '';
  if (!isText) {
    return true;
  }

  const isInIntro = document.getElementById('introContainer')?.style.display === 'block';
  if (isInIntro) {
    return true;
  }

  return false;
}

let timeoutEventHandle: ReturnType<typeof setTimeout> | null = null;
const MOVE_THRESHOLD_SQ = 16;
let lastMouseX = 0;
let lastMouseY = 0;
let hasLastMousePos = false;

function updateControlsVisibility(
  event: React.MouseEvent,
  stageState: IStageState,
  GUIState: IGuiState,
  dispatch: ReturnType<typeof useDispatch>,
) {
  const { clientX, clientY } = event;
  let movedEnough = false;
  if (!hasLastMousePos) {
    movedEnough = true;
    hasLastMousePos = true;
  } else {
    const dx = clientX - lastMouseX;
    const dy = clientY - lastMouseY;
    movedEnough = dx * dx + dy * dy >= MOVE_THRESHOLD_SQ;
  }
  lastMouseX = clientX;
  lastMouseY = clientY;

  if (!movedEnough) {
    return;
  }

  if (timeoutEventHandle) {
    clearTimeout(timeoutEventHandle);
  }

  if (isTextboxHidden(stageState, GUIState)) {
    dispatch(setVisibility({ component: 'controlsVisibility', visibility: true }));
    timeoutEventHandle = setTimeout(() => {
      dispatch(setVisibility({ component: 'controlsVisibility', visibility: false }));
    }, 1000);
    return;
  }

  checkMousePosition(event, GUIState, dispatch);
}

export const Stage: FC = () => {
  const stageState = useSelector((state: RootState) => state.stage);
  const GUIState = useSelector((state: RootState) => state.GUI);
  const dispatch = useDispatch();

  useHotkey();

  return (
    <div className={styles.MainStage_main}>
      <FullScreenPerform />
      <MainStage />
      <div id="pixiContianer" className={styles.pixiContainer} style={{ zIndex: isIOS ? '-5' : undefined }} />
      <div id="itemContainer" className={styles.itemContainer} />
      <div id="chooseContainer" className={styles.chooseContainer} />
      <div id="thinkingContainer" className={styles.thinkingContainer} />
      <div id="refuteContainer" className={styles.refuteContainer} />
      {GUIState.showTextBox && stageState.enableFilm === '' && !stageState.isDisableTextbox && <TextBox />}
      {GUIState.showTextBox && stageState.enableFilm !== '' && <TextBoxFilm />}
      <AudioContainer />
      <div
        onClick={() => {
          if (GUIState.showPhone) {
            return;
          }
          if (stageState.judgment !== '' && stageState.isDisableTextbox) {
            return;
          }
          if (!GUIState.showTextBox) {
            dispatch(setVisibility({ component: 'showTextBox', visibility: true }));
            return;
          }
          stopAll();
          nextSentence();
        }}
        onDoubleClick={() => {
          if (GUIState.showPhone) {
            return;
          }
          WebGAL.events.fullscreenDbClick.emit();
        }}
        id="FullScreenClick"
        style={{
          left: '40',
          width: '100%',
          height: '85%',
          position: 'absolute',
          zIndex: '12',
          top: '0',
          pointerEvents: GUIState.showPhone ? 'none' : 'auto',
        }}
        onMouseMove={(e) => !GUIState.showControls && updateControlsVisibility(e, stageState, GUIState, dispatch)}
      />
      <IntroContainer />
    </div>
  );
};