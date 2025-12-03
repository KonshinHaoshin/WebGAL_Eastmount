/* eslint-disable prettier/prettier */
import { FC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setVisibility, setMenuPanelTag } from '@/store/GUIReducer';
import { MenuPanelTag, componentsVisibility } from '@/store/guiInterface';
import useSoundEffect from '@/hooks/useSoundEffect';
import { backToTitle } from '@/Core/controller/gamePlay/backToTitle';
import { showGlogalDialog } from '@/UI/GlobalDialog/GlobalDialog';
import useTrans from '@/hooks/useTrans';
import phone from '@/assets/dragonspring/icon/phone.png';
// import WIFI from '@/assets/dragonspring/icon/wifi.png';
import save01 from '@/assets/dragonspring/icon/save01.png';
import save02 from '@/assets/dragonspring/icon/save02.png';
import load01 from '@/assets/dragonspring/icon/load01.png';
import load02 from '@/assets/dragonspring/icon/load02.png';
import history01 from '@/assets/dragonspring/icon/history01.png';
import history02 from '@/assets/dragonspring/icon/history02.png';
import setting01 from '@/assets/dragonspring/icon/setting01.png';
import setting02 from '@/assets/dragonspring/icon/setting02.png';
import backtotitle01 from '@/assets/dragonspring/icon/backtotitle01.png';
import backtotitle02 from '@/assets/dragonspring/icon/backtotitle02.png';
import XButton from '@/assets/dragonspring/icon/X.png';
import styles from './phone.module.scss';

/**
 * Phone 组件
 */
export const Phone: FC = () => {
    const dispatch = useDispatch();
    const { playSeClick, playSeEnter, playSeDialogOpen } = useSoundEffect();
    const GUIStore = useSelector((state: RootState) => state.GUI);
    const t = useTrans('gaming.');

    // 如果 Phone 不显示，返回 null
    if (!GUIStore.showPhone) {
        return null;
    }

    const handleClose = () => {
        dispatch(setVisibility({ component: 'showPhone', visibility: false }));
        playSeClick();
    };

    const setComponentVisibility = (component: keyof componentsVisibility, visibility: boolean) => {
        dispatch(setVisibility({ component, visibility }));
    };

    const setMenuPanel = (menuPanel: MenuPanelTag) => {
        dispatch(setMenuPanelTag(menuPanel));
    };

    // Save 按钮处理函数
    const handleSave = () => {
        setMenuPanel(MenuPanelTag.Save);
        setComponentVisibility('showMenuPanel', true);
        setComponentVisibility('showPhone', false);
        playSeClick();
    };

    // Load 按钮处理函数
    const handleLoad = () => {
        setMenuPanel(MenuPanelTag.Load);
        setComponentVisibility('showMenuPanel', true);
        setComponentVisibility('showPhone', false);
        playSeClick();
    };

    // History 按钮处理函数
    const handleHistory = () => {
        setComponentVisibility('showBacklog', true);
        setComponentVisibility('showTextBox', false);
        setComponentVisibility('showPhone', false);
        playSeClick();
    };

    // Setting 按钮处理函数
    const handleSetting = () => {
        setMenuPanel(MenuPanelTag.Option);
        setComponentVisibility('showMenuPanel', true);
        setComponentVisibility('showPhone', false);
        playSeClick();
    };

    // Back to Title 按钮处理函数
    const handleBackToTitle = () => {
        playSeDialogOpen();
        showGlogalDialog({
            title: t('buttons.titleTips'),
            leftText: t('$common.yes'),
            rightText: t('$common.no'),
            leftFunc: () => {
                backToTitle();
            },
            rightFunc: () => { },
        });
        setComponentVisibility('showPhone', false);
    };

    return (
        <div className={styles.phoneContainer}>
            <div className={styles.phone}>
                <img src={phone} alt="Phone" className={styles.phoneImage} />

                {/* 左上角 WIFI 图标
              <div className={styles.wifiIcon}>
                  <img src={WIFI} alt="WIFI" />
              </div> */}

              {/* 右上角 X 按钮 */}
              <div className={styles.closeButton} onClick={handleClose} onMouseEnter={playSeEnter}>
                  <img src={XButton} alt="Close" />
              </div>

              {/* 功能按钮区域 */}
              <PhoneButton
                  className={styles.saveButton}
                  normal={save01}
                  hover={save02}
                    onClick={handleSave}
                  onMouseEnter={playSeEnter}
              />
              <PhoneButton
                  className={styles.loadButton}
                  normal={load01}
                  hover={load02}
                    onClick={handleLoad}
                  onMouseEnter={playSeEnter}
              />
              <PhoneButton
                  className={styles.historyButton}
                  normal={history01}
                  hover={history02}
                    onClick={handleHistory}
                  onMouseEnter={playSeEnter}
              />
              <PhoneButton
                  className={styles.settingButton}
                  normal={setting01}
                  hover={setting02}
                    onClick={handleSetting}
                  onMouseEnter={playSeEnter}
              />
              <PhoneButton
                  className={styles.backtotitleButton}
                  normal={backtotitle01}
                  hover={backtotitle02}
                    onClick={handleBackToTitle}
                  onMouseEnter={playSeEnter}
              />
          </div>
      </div>
  );
};

/**
 * Phone 按钮组件
 */
interface PhoneButtonProps {
    className?: string;
    normal: string;
    hover: string;
    onClick: () => void;
    onMouseEnter: () => void;
}

const PhoneButton: FC<PhoneButtonProps> = ({ className, normal, hover, onClick, onMouseEnter }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`${styles.phoneButton} ${className || ''}`}
            onClick={onClick}
            onMouseEnter={() => {
                setIsHovered(true);
                onMouseEnter();
            }}
            onMouseLeave={() => setIsHovered(false)}
        >
            <img src={isHovered ? hover : normal} alt="Button" />
        </div>
  );
};
