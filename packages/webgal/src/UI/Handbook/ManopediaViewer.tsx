import { FC, ReactNode, useState } from 'react';
import useSoundEffect from '@/hooks/useSoundEffect';
import { InventoryViewer } from './InventoryViewer';
import styles from './manopediaViewer.module.scss';

interface IManopediaViewerProps {
  children: ReactNode;
}

// todo: 实现魔女图鉴查看器
// 会实现的……
export const ManopediaViewer: FC<IManopediaViewerProps> = ({ children }) => {
  const [showViewer, setShowViewer] = useState(false);
  const { playSeClick } = useSoundEffect();

  const handleClick = () => {
    setShowViewer(true);
    playSeClick();
  };

  const handleClose = () => {
    setShowViewer(false);
    playSeClick();
  };

  return (
    <>
      <span onClick={handleClick}>{children}</span>
      {showViewer && (
        <div className={styles.viewerOverlay} onClick={handleClose}>
          <div className={styles.viewerContainer} onClick={(e) => e.stopPropagation()}>
            <InventoryViewer onClose={handleClose} />
          </div>
        </div>
      )}
    </>
  );
};
