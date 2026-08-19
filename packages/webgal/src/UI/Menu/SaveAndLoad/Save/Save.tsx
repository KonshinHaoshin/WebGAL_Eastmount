import { FC, useEffect } from 'react';
import styles from '../SaveAndLoad.module.scss';
import { saveGame } from '@/Core/controller/storage/saveGame';
import { setStorage } from '@/Core/controller/storage/storageController';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setSlPage } from '@/store/userDataReducer';
import { showGlogalDialog } from '@/UI/GlobalDialog/GlobalDialog';
import useTrans from '@/hooks/useTrans';
import useSoundEffect from '@/hooks/useSoundEffect';
import { getSavesFromStorage } from '@/Core/controller/storage/savesController';
import { compileSentence } from '@/Stage/TextBox/TextBox';
import { mergeStringsAndKeepObjects } from '@/UI/Backlog/Backlog';

export const Save: FC = () => {
  const { playSePageChange, playSeEnter, playSeDialogOpen } = useSoundEffect();
  const userDataState = useSelector((state: RootState) => state.userData);
  const savesDataState = useSelector((state: RootState) => state.saveData);
  const dispatch = useDispatch();

  const page = [];
  for (let i = 1; i <= 20; i++) {
    let classNameOfElement = styles.Save_Load_top_button;
    if (i === userDataState.optionData.slPage) {
      classNameOfElement += ` ${styles.Save_Load_top_button_on}`;
    }
    page.push(
      <div
        onClick={() => {
          dispatch(setSlPage(i));
          setStorage();
          playSePageChange();
        }}
        // onMouseEnter={playSeEnter}
        key={'Save_element_page' + i}
        className={classNameOfElement}
      >
        <div className={styles.Save_Load_top_button_text}>{i}</div>
      </div>
    );
  }

  const tCommon = useTrans('common.');
  const t = useTrans('menu.');
  const showSaves = [];

  // 改为五条
  const start = (userDataState.optionData.slPage - 1) * 5 + 1;
  const end = start + 4;

  useEffect(() => {
    getSavesFromStorage(start, end);
  }, [start, end]);

  let animationIndex = 0;
  for (let i = start; i <= end; i++) {
    animationIndex++;
    const saveData = savesDataState.saveData[i];
    let saveElementContent = <div />;

    if (saveData) {
      const speaker = saveData.nowStageState.showName || '\u00A0';
      const speakerView = easyCompile(speaker);

      saveElementContent = (
        <>
          <img className={styles.previewImg} src={saveData.previewImage} alt="preview" />
          <div className={styles.textBlock}>
            <div className={styles.titleLine}>
              <span className={styles.index}>No.{saveData.index}</span>
              <span className={styles.time}>{saveData.saveTime}</span>
            </div>
            <div className={styles.speaker}>{speakerView}</div>
            <div className={styles.text}>{easyCompile(saveData.nowStageState.showText)}</div>
          </div>
        </>
      );
    }

    showSaves.push(
      <div
        onClick={() => {
          if (savesDataState.saveData[i]) {
            playSeDialogOpen();
            showGlogalDialog({
              title: t('saving.isOverwrite'),
              leftText: tCommon('yes'),
              rightText: tCommon('no'),
              leftFunc: () => {
                saveGame(i);
                setStorage();
              },
              rightFunc: () => {},
            });
          } else {
            playSePageChange();
            saveGame(i);
          }
        }}
        // onMouseEnter={playSeEnter}
        key={'saveElement_' + i}
        className={styles.Save_Load_content_element}
        style={{ animationDelay: `${animationIndex * 30}ms` }}
      >
        {saveElementContent}
      </div>
    );
  }

  return (
    <div className={styles.Save_Load_main}>
      <div className={styles.Save_Load_top}>
        <div className={styles.Save_Load_title}>
          <div className={styles.Save_title_text}>{t('saving.title')}</div>
        </div>
        <div className={styles.Save_Load_top_buttonList}>{page}</div>
      </div>
      <div className={styles.Save_Load_content} id={`Save_content_page_${userDataState.optionData.slPage}`}>
        {showSaves}
      </div>
    </div>
  );
};

export function easyCompile(sentence: string) {
  const compiledNodes = compileSentence(sentence, 3, true);
  const rnodes = compiledNodes.map((line) => line.map((c) => c.reactNode));
  const showNameArrayReduced = mergeStringsAndKeepObjects(rnodes);
  return showNameArrayReduced.map((line, index) => (
    <div key={`backlog-line-${index}`}>
      {line.map((e, i) => (e === '<br />' ? <br key={`br${i}`} /> : e))}
    </div>
  ));
}
