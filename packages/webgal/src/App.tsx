import { Stage } from '@/Stage/Stage';
import { Backlog } from '@/UI/Backlog/Backlog';
// import { BottomControlPanel } from '@/UI/BottomControlPanel/BottomControlPanel';
import { BottomControlPanelFilm } from '@/UI/BottomControlPanel/BottomControlPanelFilm';
import DevPanel from '@/UI/DevPanel/DevPanel';
import { Extra } from '@/UI/Extra/Extra';
import { GearButton } from '@/UI/gearButton';
import { HandboxButton } from '@/UI/Handbook/HandboxButton';
import { Timer } from '@/UI/judgment/timer';
import { TestimonyLayer } from '@/UI/judgment/testimonyLayer';
import { InlineThinkingOverlay } from '@/UI/judgment/inlineThinkingOverlay';
import GlobalDialog from '@/UI/GlobalDialog/GlobalDialog';
import EvidenceConfirmDialog from '@/UI/EvidenceConfirmDialog/EvidenceConfirmDialog';
import Logo from '@/UI/Logo/Logo';
import Menu from '@/UI/Menu/Menu';
import { PanicOverlay } from '@/UI/PanicOverlay/PanicOverlay';
import Title from '@/UI/Title/Title';
import Translation from '@/UI/Translation/Translation';
import { Phone } from '@/UI/Phone/Phone';
import { ItemDisplay } from '@/UI/ItemDisplay/ItemDispaly';
import { ManopediaUpdate } from '@/UI/manopedia/manopedia_update';
import { Manopedia } from '@/UI/manopedia/manopedia';
import { ShowItem } from '@/UI/manopedia/showItem';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { initializeScript } from './Core/initializeScript';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store/store';
import { setStage } from './store/stageReducer';

function App() {
  const showManopedia = useSelector((state: RootState) => state.stage.showManopedia);
  const dispatch = useDispatch();

  useEffect(() => {
    initializeScript();
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-quart',
      startEvent: 'DOMContentLoaded',
    });

    setTimeout(() => {
      AOS.refreshHard();
    }, 50);
  }, []);

  // Provider用于对各组件提供状态
  return (
    <div className="App">
      <Translation />
      <Stage />
      {/* <BottomControlPanel /> */}
      <BottomControlPanelFilm />
      <GearButton />
      <HandboxButton />
      <Timer />
      <TestimonyLayer />
      <InlineThinkingOverlay />
      <Backlog />
      <Title />
      <Logo />
      <Extra />
      <Menu />
      <GlobalDialog />
      <EvidenceConfirmDialog />
      <PanicOverlay />
      <Phone />
      <DevPanel />
      <ItemDisplay />
      <ManopediaUpdate />
      <ShowItem />
      {showManopedia && (
        <Manopedia
          onClose={() => {
            dispatch(setStage({ key: 'showManopedia', value: false }));
          }}
        />
      )}
    </div>
  );
}

export default App;
