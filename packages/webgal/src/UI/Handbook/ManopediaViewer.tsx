import { FC, ReactNode, useState } from 'react';
import useSoundEffect from '@/hooks/useSoundEffect';
import { Manopedia } from '@/UI/manopedia/manopedia';
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
      {showViewer && <Manopedia onClose={handleClose} />}
    </>
  );
};
