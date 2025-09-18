### [1.1.0](https://github.com/gridonic/dastro/compare/v1.0.9...v1.1.0)

- Add lodash and alpine js (alpine must still be activated in projects config)
- For now, always use locales without their variants in urls (that means, only one language variant is allowed for now)
- Update dependencies
- **BREAKING:** You must add the `routingStrategy` variable to your dastro config. set it to 'prefix-except-default' to keep the same strategy as before

### [1.0.9](https://github.com/gridonic/dastro/compare/v1.0.8...v1.0.9)

- Add utils, for now a slugify helper
- Init testing using vitest
- Allow to pass any attribute to RecordLink

### [1.0.8](https://github.com/gridonic/dastro/compare/v1.0.7...v1.0.8)

- allow to add all rest parameters to a in record link

### [1.0.7](https://github.com/gridonic/dastro/compare/v1.0.6...v1.0.7)

- remove og:locale insertion
- UPGRADE: you should make sure that in your language switcher, lang and hreflang use normalizeIsoLocale(locale) instead of locale only

### [1.0.6](https://github.com/gridonic/dastro/compare/v1.0.5...v1.0.6)

- Use locale without variants

### [1.0.5](https://github.com/gridonic/dastro/compare/v1.0.4...v1.0.5)

- Allow configuration of multiple graphql projects
- Add new project creation script

### [1.0.4](https://github.com/gridonic/dastro/compare/v1.0.3...v1.0.4)

- Add more information and commands in cli

### [1.0.3](https://github.com/gridonic/dastro/compare/v1.0.2...v1.0.3)

- Add new cli commands
- Allow to pass on props of Datocms Structured Text in DefaultStructuredText

### [1.0.2](https://github.com/gridonic/dastro/compare/v1.0.1...v1.0.2)

- Configure and add commands for local development and release management

### [1.0.1](https://github.com/gridonic/dastro/compare/v1.0.0...v1.0.1)

- Fixes errors due to locales with variants (de-CH) due to hyphen / underscore inconsistencies

### 1.0.0

- Initial version
