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
