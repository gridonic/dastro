export type AstroComponent = (props: any) => any;

export interface Module {
  __typename: string;
}


export interface ImageAssetData {
  responsiveImage?: {
    __typename?: 'ResponsiveImage',
    src: string,
    width: number,
    height: number
  } | null
}

export interface VideoAssetData {
  video?: {
    __typename?: 'UploadVideoField',
    streamingUrl: string,
    muxPlaybackId: string,
    duration?: number | null,
    framerate?: number | null,
    width: number,
    height: number,
    thumbnailUrl: string,
    urlHighRes?: string | null,
    urlMediumRes?: string | null,
    urlLowRes?: string | null
  } | null
}

export interface VideoPlayerData {
  __typename?: 'VideoRecord',
    video: {
    __typename: 'VideoExternalRecord',
      videoReference: { __typename?: 'VideoField', provider: string, providerUid: string }
  } | {
    __typename: 'VideoInlineRecord',
      showControls: boolean,
      autoplay: boolean,
      loop: boolean,
      muted: boolean,
      videoAsset: {
      __typename?: 'VideoFileField',
        video: { __typename?: 'UploadVideoField', width: number, height: number, mp4Url?: string | null }
    }
  },
  posterImage?: {
    __typename?: 'FileField',
    url: string,
    alt?: string | null,
    mimeType: string,
    responsiveImage?: {
      __typename?: 'ResponsiveImage',
      src: string,
      width: number,
      height: number,
      sizes: string
    } | null
  } | null
}
