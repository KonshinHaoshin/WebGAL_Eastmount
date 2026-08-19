import { useEffect } from 'react';
import { initializeScript } from '@/Core/initializeScript';
import Translation from '@/UI/Translation/Translation';
import { Stage } from '@/Stage/Stage';
import { BottomControlPanel } from '@/UI/BottomControlPanel/BottomControlPanel';
import { BottomControlPanelFilm } from '@/UI/BottomControlPanel/BottomControlPanelFilm';
import { Backlog } from '@/UI/Backlog/Backlog';
import Title from '@/UI/Title/Title';
import Logo from '@/UI/Logo/Logo';
import { Extra } from '@/UI/Extra/Extra';
import Menu from '@/UI/Menu/Menu';
import GlobalDialog from '@/UI/GlobalDialog/GlobalDialog';
import PanicOverlay from '@/UI/PanicOverlay/PanicOverlay';
import DevPanel from '@/UI/DevPanel/DevPanel';
import { GearButton } from '@/UI/gearButton';
import { HandboxButton } from '@/UI/Handbook/HandboxButton';
import { Timer } from '@/UI/judgment/timer';
import { TestimonyLayer } from '@/UI/judgment/testimonyLayer';
import { InlineThinkingOverlay } from '@/UI/judgment/inlineThinkingOverlay';
import EvidenceConfirmDialog from '@/UI/EvidenceConfirmDialog/EvidenceConfirmDialog';
import { Phone } from '@/UI/Phone/Phone';
import { ItemDisplay } from '@/UI/ItemDisplay/ItemDispaly';
import { ManopediaUpdate } from '@/UI/manopedia/manopedia_update';
import { Manopedia } from '@/UI/manopedia/manopedia';
import { ShowItem } from '@/UI/manopedia/showItem';
import { useSelector } from 'react-redux';
import { RootState, webgalStore } from '@/store/store';
import { setStage } from '@/store/stageReducer';

export default function App() {
  const showManopedia = useSelector((state: RootState) => state.stage.showManopedia);
  useEffect(() => {
    initializeScript();
  }, []);
  return (
    <div className="App">
      <Translation />
      <Stage />
      <BottomControlPanel />
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
        <Manopedia onClose={() => webgalStore.dispatch(setStage({ key: 'showManopedia', value: false }))} />
      )}
    </div>
  );
}
