import {loadFont as loadCaveat} from '@remotion/google-fonts/CaveatBrush';
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadGrotesk} from '@remotion/google-fonts/SpaceGrotesk';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const C = {
  paper: '#FBF7EE',
  dot: '#D6CDBB',
  pink: '#FF48B0',
  yellow: '#FFE800',
  teal: '#00838A',
  blue: '#0078BF',
  purple: '#765BA7',
  ink: '#1F1F1F',
  grey: '#8A8478',
  white: '#FFFDF8',
  news: '#F6F0E1',
  newsInk: '#161616',
  tomato: '#E8432E',
  sun: '#FFC62E',
};

export const hand = loadCaveat('normal', {subsets: ['latin']}).fontFamily;
export const sans = loadGrotesk('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily;
export const serif = loadPlayfair('normal', {weights: ['900'], subsets: ['latin']}).fontFamily;
