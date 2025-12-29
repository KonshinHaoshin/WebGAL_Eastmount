import { FC, useState } from 'react';
import useSoundEffect from '@/hooks/useSoundEffect';
import styles from './manopedia.module.scss';
import manopediaBackgorund from '@/assets/dragonspring/manopedia/manopedia.png';
import closeButton from '@/assets/dragonspring/manopedia/closeButton.png';
import closeButtonHover from '@/assets/dragonspring/manopedia/closeButton_hover.png';

// 5个功能按钮
import Exhibit from '@/assets/dragonspring/manopedia/Exhibit.png';
import ExhibitHover from '@/assets/dragonspring/manopedia/Exhibit_on.png';
import Figure from '@/assets/dragonspring/manopedia/Figure.png';
import FigureHover from '@/assets/dragonspring/manopedia/Figure_on.png';
import Map from '@/assets/dragonspring/manopedia/Map.png';
import MapHover from '@/assets/dragonspring/manopedia/Map_on.png';
import Rule from '@/assets/dragonspring/manopedia/Rule.png';
import RuleHover from '@/assets/dragonspring/manopedia/Rule_on.png';
import Record from '@/assets/dragonspring/manopedia/Record.png';
import RecordHover from '@/assets/dragonspring/manopedia/Record_on.png';
// frame和items
import frame from '@/assets/dragonspring/manopedia/manopedia_frame.png';
import itemsDisplay from '@/assets/dragonspring/manopedia/manopedia_items.png';

interface ManopediaProps {
    onClose: () => void;
}

type ButtonType = 'exhibit' | 'figure' | 'map' | 'rule' | 'record';

/**
 * 魔女图鉴界面组件 - 显示五个功能按钮和关闭按钮
 */
export const Manopedia: FC<ManopediaProps> = ({ onClose }) => {
    const { playSeClick, playSeEnter } = useSoundEffect();
    const [isCloseButtonHovered, setIsCloseButtonHovered] = useState(false);
    const [hoveredButton, setHoveredButton] = useState<ButtonType>('exhibit'); // Exhibit初始为hover状态

    const handleClose = () => {
        playSeClick();
        onClose();
    };

    const handleCloseButtonEnter = () => {
        setIsCloseButtonHovered(true);
        playSeEnter();
    };

    const handleCloseButtonLeave = () => {
        setIsCloseButtonHovered(false);
    };

    const handleButtonEnter = (buttonType: ButtonType) => {
        setHoveredButton(buttonType);
        playSeEnter();
    };

    const handleButtonLeave = () => {
        setHoveredButton('exhibit'); // 鼠标离开时恢复Exhibit为hover状态
    };

    const handleButtonClick = (buttonType: ButtonType) => {
        playSeClick();
        // 这里可以添加各个按钮的点击逻辑
        console.log(`点击了按钮: ${buttonType}`);
    };

    // 按钮配置
    const buttons: { type: ButtonType; normal: string; hover: string }[] = [
        { type: 'exhibit', normal: Exhibit, hover: ExhibitHover },
        { type: 'figure', normal: Figure, hover: FigureHover },
        { type: 'map', normal: Map, hover: MapHover },
        { type: 'rule', normal: Rule, hover: RuleHover },
        { type: 'record', normal: Record, hover: RecordHover },
    ];

    return (
        <div className={styles.manopediaOverlay} style={{ backgroundImage: `url(${manopediaBackgorund})` }}>
            {/* 有alpha通道的frame资产 */}
            <img src={frame} alt="manopedia frame" className={styles.frameAsset} />

            {/* 有alpha通道的items显示资产 */}
            <img src={itemsDisplay} alt="manopedia items display" className={styles.itemsDisplayAsset} />

            {/* 右侧五个功能按钮 */}
            <div className={styles.rightButtonsContainer} onMouseLeave={handleButtonLeave}>
                {buttons.map((button) => (
                    <div
                        key={button.type}
                        className={styles.rightButtonContainer}
                        style={{
                            order:
                                button.type === 'map'
                                    ? 3
                                    : button.type === 'exhibit'
                                        ? 1
                                        : button.type === 'figure'
                                            ? 2
                                            : button.type === 'rule'
                                                ? 4
                                                : 5,
                        }}
                    >
                        <img
                            src={hoveredButton === button.type ? button.hover : button.normal}
                            alt={button.type}
                            className={styles.rightButton}
                            onClick={() => handleButtonClick(button.type)}
                            onMouseEnter={() => handleButtonEnter(button.type)}
                        />
                    </div>
                ))}
            </div>

            {/* 关闭按钮 */}
            <div
                className={styles.closeButtonsContainer}
                onClick={handleClose}
                onMouseEnter={handleCloseButtonEnter}
                onMouseLeave={handleCloseButtonLeave}
            >
                <div
                    className={styles.closeButton}
                    style={{
                        backgroundImage: `url(${isCloseButtonHovered ? closeButtonHover : closeButton})`,
                    }}
                />
            </div>
        </div>
    );
};
