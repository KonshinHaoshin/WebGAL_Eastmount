import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { PanicYoozle } from '@/UI/PanicOverlay/PanicYoozle/PanicYoozle';
import styles from './panicOverlay.module.scss';

export default function PanicOverlay() {
  const GUIStore = useSelector((state: RootState) => state.GUI);
  const [showOverlay, setShowOverlay] = useState(false);
  const globalVars = useSelector((state: RootState) => state.userData.globalGameVar);
  const panic = globalVars['Show_panic'];
  const hidePanic = panic === false;
  useEffect(() => {
    const isShowOverlay = GUIStore.showPanicOverlay && !hidePanic;
    setShowOverlay(isShowOverlay);
  }, [GUIStore.showPanicOverlay, hidePanic]);

  const container =
    document.querySelector('div#panic-overlay') || document.querySelector('#html-body__panic-overlay');

  return container
    ? ReactDOM.createPortal(
        <div className={showOverlay ? styles.panic_overlay_main : ''}>{showOverlay && <PanicYoozle />}</div>,
        container,
      )
    : null;
}