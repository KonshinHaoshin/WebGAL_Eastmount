import { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setMenuPanelTag, setVisibility } from '@/store/GUIReducer';
import { MenuPanelTag } from '@/store/guiInterface';
import { RootState } from '@/store/store';
import useSoundEffect from '@/hooks/useSoundEffect';
import gear from '@/assets/dragonspring/gear.png';
import styles from './gearButton.module.scss';

/**
 * 齿轮按钮组件，点击可以打开选项菜单
 */
export const GearButton: FC = () => {
    const dispatch = useDispatch();
    const { playSeClick, playSeEnter } = useSoundEffect();
    const GUIStore = useSelector((state: RootState) => state.GUI);

    // 标题界面不显示 gear 按钮
    if (GUIStore.showTitle) {
        return null;
    }

    const handleClick = () => {
        dispatch(setMenuPanelTag(MenuPanelTag.Option));
        dispatch(setVisibility({ component: 'showMenuPanel', visibility: true }));
        playSeClick();
    };

    return (
        <span className={styles.gearButton} onClick={handleClick} onMouseEnter={playSeEnter}>
            <img src={gear} alt="Settings" className={styles.gearIcon} />
        </span>
    );
};
