import styles from './evidenceConfirmDialog.module.scss';
import ReactDOM from 'react-dom';
import { useSEByWebgalStore } from '@/hooks/useSoundEffect';

interface IEvidenceConfirmDialogProps {
  title: string;
  leftText: string;
  rightText: string;
  leftFunc: Function;
  rightFunc: Function;
  onClose: () => void;
}

export function showEvidenceConfirmDialog(props: IEvidenceConfirmDialogProps) {
  const { playSeClick, playSeEnter } = useSEByWebgalStore();
  
  const handleLeft = () => {
    playSeClick();
    props.leftFunc();
    hideEvidenceConfirmDialog();
  };
  
  const handleRight = () => {
    playSeClick();
    props.rightFunc();
    hideEvidenceConfirmDialog();
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleLeft(); // 点击背景相当于点击返回按钮
    }
  };

  const renderElement = (
    <div className={styles.EvidenceConfirmDialog_main} onClick={handleBackgroundClick}>
      <div className={styles.evidenceConfirmDialog_container}>
        <div className={styles.evidenceConfirmDialog_container_inner}>
          <div className={styles.title}>{props.title}</div>
          <div className={styles.button_list}>
            <div 
              className={styles.button} 
              onClick={handleLeft}
              onMouseEnter={() => playSeEnter()}
            >
              <span>{props.leftText}</span>
            </div>
            <div 
              className={styles.button} 
              onClick={handleRight}
              onMouseEnter={() => playSeEnter()}
            >
              <span style={{ color: '#da98a3' }}>{props.rightText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  setTimeout(() => {
    // eslint-disable-next-line react/no-deprecated
    ReactDOM.render(renderElement, document.getElementById('evidenceConfirmDialogContainer'));
  }, 100);
}

export function hideEvidenceConfirmDialog() {
  const container = document.getElementById('evidenceConfirmDialogContainer');
  if (container) {
    // eslint-disable-next-line react/no-deprecated
    ReactDOM.unmountComponentAtNode(container);
  }
}

// 主组件
export default function EvidenceConfirmDialog() {
  return <div id="evidenceConfirmDialogContainer" />;
}
