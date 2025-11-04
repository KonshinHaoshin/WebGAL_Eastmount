import { FC } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import useSoundEffect from '@/hooks/useSoundEffect';
import manopedia from '@/assets/dragonspring/manopedia.png';
import styles from './handboxButton.module.scss';
import { ManopediaViewer } from './ManopediaViewer';

/**
 * 魔女图鉴按钮组件
 */
export const HandboxButton: FC = () => {
    const { playSeClick, playSeEnter } = useSoundEffect();
    const stageState = useSelector((state: RootState) => state.stage);

    // 只有当 enableManopedia 为 true 时才显示按钮
    if (!stageState.enableManopedia) {
        return null;
    }

    return (
        <span className={styles.handboxButton} onMouseEnter={playSeEnter}>
            <ManopediaViewer>
                <img src={manopedia} alt="Manopedia" className={styles.handboxIcon} />
            </ManopediaViewer>
        </span>
    );
};
