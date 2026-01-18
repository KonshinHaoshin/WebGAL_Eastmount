import { FC, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './title.module.scss';
import { playBgm } from '@/Core/controller/stage/playBgm';
import { startGame } from '@/Core/controller/gamePlay/startContinueGame';
import { RootState } from '@/store/store';
import { fullScreenOption } from '@/store/userDataInterface';
import { setMenuPanelTag, setVisibility } from '@/store/GUIReducer';
import { MenuPanelTag } from '@/store/guiInterface';
import useTrans from '@/hooks/useTrans';
import useSoundEffect from '@/hooks/useSoundEffect';
import useApplyStyle from '@/hooks/useApplyStyle';
import { keyboard } from '@/hooks/useHotkey';
import useConfigData from '@/hooks/useConfigData';
import { showGlogalDialog } from '../GlobalDialog/GlobalDialog';

import NewGame01 from '@/assets/dragonspring/NewGame01.png';
import NewGame02 from '@/assets/dragonspring/NewGame02.png';
import LoadGame01 from '@/assets/dragonspring/LoadGame01.png';
import LoadGame02 from '@/assets/dragonspring/LoadGame02.png';
import Options01 from '@/assets/dragonspring/Options01.png';
import Options02 from '@/assets/dragonspring/Options02.png';
import Exit01 from '@/assets/dragonspring/Exit01.png';
import Exit02 from '@/assets/dragonspring/Exit02.png';
import Gallery01 from '@/assets/dragonspring/Gallery01.png';
import Gallery02 from '@/assets/dragonspring/Gallery02.png';

interface ImgButtonProps {
  normal: string;
  hover: string;
  alt: string;
  disabled?: boolean;
  onClick?: () => void;
  onHover?: () => void;
}

/** Õº∆¨∞¥≈•£∫÷ß≥÷ hover «–ªª°¢Ω˚”√Ã¨°¢º¸≈Ãµº∫Ω */
const ImgButton: FC<ImgButtonProps> = ({ normal, hover, alt, disabled, onClick, onHover }) => {
  const [isHover, setIsHover] = useState(false);
  const current = isHover && !disabled ? hover : normal;

  return (
    <button
      className={styles.Title_imgButton}
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) onClick?.();
      }}
      onMouseEnter={() => {
        if (!disabled) {
          setIsHover(true);
          onHover?.();
        }
      }}
      onMouseLeave={() => setIsHover(false)}
      onFocus={() => {
        if (!disabled) {
          setIsHover(true);
          onHover?.();
        }
      }}
      onBlur={() => setIsHover(false)}
      aria-label={alt}
    >
      <img src={current} alt="" draggable={false} />
      <span className={styles.srOnly}>{alt}</span>
    </button>
  );
};

export default function Title() {
  const userDataState = useSelector((state: RootState) => state.userData);
  const GUIState = useSelector((state: RootState) => state.GUI);
  const dispatch = useDispatch();
  const fullScreen = userDataState.optionData.fullScreen;
  const background = GUIState.titleBg;
  const showBackground = background === '' ? 'rgba(0,0,0,1)' : `url("${background}")`;
  const t = useTrans('title.');
  const tCommon = useTrans('common.');
  const { playSeEnter, playSeClick } = useSoundEffect();

  const applyStyle = useApplyStyle('UI/Title/title.scss');
  useConfigData();

  const appreciationItems = useSelector((state: RootState) => state.userData.appreciationData);
  const hasAppreciationItems = appreciationItems.bgm.length > 0 || appreciationItems.cg.length > 0;

  const buttons = useMemo(() => {
    const arr: {
      key: string;
      alt: string;
      normal: string;
      hover: string;
      onClick: () => void;
      disabled?: boolean;
    }[] = [
      {
        key: 'load',
        alt: t('load.title'),
        normal: LoadGame01,
        hover: LoadGame02,
        onClick: () => {
          playSeClick();
          dispatch(setVisibility({ component: 'showMenuPanel', visibility: true }));
          dispatch(setMenuPanelTag(MenuPanelTag.Load));
        },
      },
      {
        key: 'start',
        alt: t('start.title'),
        normal: NewGame01,
        hover: NewGame02,
        onClick: () => {
          startGame();
          playSeClick();
        },
      },
      {
        key: 'options',
        alt: t('options.title'),
        normal: Options01,
        hover: Options02,
        onClick: () => {
          playSeClick();
          dispatch(setVisibility({ component: 'showMenuPanel', visibility: true }));
          dispatch(setMenuPanelTag(MenuPanelTag.Option));
        },
      },
    ];

    if (GUIState.enableAppreciationMode) {
      arr.push({
        key: 'extra',
        alt: t('extra.title'),
        normal: Gallery01,
        hover: Gallery02,
        disabled: !hasAppreciationItems,
        onClick: () => {
          if (hasAppreciationItems) {
            playSeClick();
            dispatch(setVisibility({ component: 'showExtra', visibility: true }));
          }
        },
      });
    }

    arr.push({
      key: 'exit',
      alt: t('exit.title'),
      normal: Exit01,
      hover: Exit02,
      onClick: () => {
        playSeClick();
        showGlogalDialog({
          title: t('exit.tips'),
          leftText: tCommon('yes'),
          rightText: tCommon('no'),
          leftFunc: () => {
            window.close();
          },
          rightFunc: () => {},
        });
      },
    });

    return arr;
  }, [t, tCommon, GUIState.enableAppreciationMode, hasAppreciationItems, dispatch, playSeClick]);

  return (
    <>
      {GUIState.showTitle && <div className={applyStyle('Title_backup_background', styles.Title_backup_background)} />}

      <div
        id="enter_game_target"
        className="title__enter-game-target"
        onClick={() => {
          playBgm(GUIState.titleBgm);
          dispatch(setVisibility({ component: 'isEnterGame', visibility: true }));
          if (fullScreen === fullScreenOption.on) {
            document.documentElement.requestFullscreen();
            if (keyboard) keyboard.lock(['Escape', 'F11']);
          }
        }}
        onMouseEnter={playSeEnter}
      />

      {GUIState.showTitle && (
        <div
          className={applyStyle('Title_main', styles.Title_main)}
          style={{
            backgroundImage: showBackground,
            backgroundSize: 'cover',
          }}
        >
          <div className={applyStyle('Title_buttonContainer', styles.Title_buttonContainer)}>
            <div className={styles.Title_buttonList}>
              {buttons.map((btn, i) => (
                <div key={btn.key} className={`${styles.Title_buttonWrapper} ${styles[`pos${i + 1}`]}`}>
                  <ImgButton
                    normal={btn.normal}
                    hover={btn.hover}
                    alt={btn.alt}
                    disabled={btn.disabled}
                    onClick={btn.onClick}
                    onHover={playSeEnter}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}