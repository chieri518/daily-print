import {Config} from '@remotion/cli/config';

// Clips, voice, music and images live in tutorial/assets.
Config.setPublicDir('../assets');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
