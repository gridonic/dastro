export type { AstroComponent } from './component.types';

import LayoutBase from './layout/LayoutBase.astro';
import DebugView from './layout/DebugView.astro';

import RecordLink from './link/RecordLink.astro';

import DefaultStructuredText from './common/DefaultStructuredText.astro';

import ImageAsset from './media/ImageAsset.astro';
import VideoAsset from './media/VideoAsset.astro';
import MediaAsset from './media/MediaAsset.astro';

import Modules from './module/Modules.astro';
import HeaderModule from './module/HeaderModule.astro';

export {
  LayoutBase,
  DebugView,
  RecordLink,
  DefaultStructuredText,
  ImageAsset,
  VideoAsset,
  MediaAsset,
  HeaderModule,
  Modules
};
