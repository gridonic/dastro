export interface ContentLinkOptions {
  /** DatoCMS editing URL, e.g. `${editingUrl}#fieldPath=nav_links` */
  url?: string;
  /** Stega-encoded source text for elements without visible stega content */
  source?: string;
  /** Mark as a content-link group (larger clickable edit area) */
  group?: boolean;
  /** Mark as a content-link boundary (prevent click bubbling) */
  boundary?: boolean;
}

export function contentLinkAttrs(opts: ContentLinkOptions) {
  return {
    ...(opts.url && { 'data-datocms-content-link-url': opts.url }),
    ...(opts.source && { 'data-datocms-content-link-source': opts.source }),
    ...(opts.group && { 'data-datocms-content-link-group': '' }),
    ...(opts.boundary && { 'data-datocms-content-link-boundary': '' }),
  };
}
