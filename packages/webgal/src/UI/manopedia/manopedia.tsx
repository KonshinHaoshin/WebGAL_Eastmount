import { FC, useState } from 'react';
import useSoundEffect from '@/hooks/useSoundEffect';
import styles from './manopedia.module.scss';
import manopediaBackgorund from '@/assets/dragonspring/manopedia/manopedia.png';
import closeButton from '@/assets/dragonspring/manopedia/closeButton.png';
import closeButtonHover from '@/assets/dragonspring/manopedia/closeButton_hover.png';

interface ManopediaProps {
    onClose: () => void;
}

/**
 * 魔女图鉴界面组件 - 显示两个关闭按钮（普通和悬停状态）
 */
export const Manopedia: FC<ManopediaProps> = ({ onClose }) => {
    const { playSeClick, playSeEnter } = useSoundEffect();
    const [isCloseButtonHovered, setIsCloseButtonHovered] = useState(false);

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

    return (
        <div className={styles.manopediaOverlay} style={{ backgroundImage: `url(${manopediaBackgorund})` }}>
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
