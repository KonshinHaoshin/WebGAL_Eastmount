import pageFlip from '@/assets/se/page-flip-1.mp3';
import switchSound from '@/assets/se/switch-1.mp3';
import mouseEnter from '@/assets/se/mouse-enter.mp3';
import dialog from '@/assets/se/dialog.mp3';
import click from '@/assets/se/click.mp3';
import openMedia from '@/assets/dragonspring/ogg/open_media.ogg';
import openGear from '@/assets/dragonspring/ogg/open_gearbutton.ogg';
import closePedia from '@/assets/dragonspring/ogg/close_pedia.ogg';
import closeGear from '@/assets/dragonspring/ogg/close_gearbutton.ogg';
import choose from '@/assets/dragonspring/ogg/choose.ogg';
import pediaChoose from '@/assets/dragonspring/ogg/pedia_choose.ogg';
import cancel from '@/assets/dragonspring/ogg/right_click.ogg';
import { stageStateManager } from '@/Core/Modules/stage/stageStateManager';

const play = (source: string) => stageStateManager.setStageAndCommit('uiSe', source);

const useSoundEffect = () => ({
  playSeEnter: () => play(mouseEnter),
  playSeClick: () => play(choose || click),
  playSeCancel: () => play(cancel),
  playSeManopedia: () => play(openMedia),
  playSeGear: () => play(openGear),
  playSeCloseGear: () => play(closeGear),
  playSeCloseManopedia: () => play(closePedia),
  playSePediaChoose: () => play(pediaChoose),
  playSeSwitch: () => play(switchSound),
  playSePageChange: () => play(pageFlip),
  playSeDialogOpen: () => play(dialog),
});

export const useSEByWebgalStore = () => ({
  playSeEnter: () => play(mouseEnter),
  playSeClick: () => play(choose || click),
  playSeCancel: () => play(cancel),
});

export default useSoundEffect;
