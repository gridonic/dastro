### [1.1.5](https://github.com/gridonic/dastro/compare/v1.1.4...v1.1.5)

- add datocms site url to system info

### [1.1.4](https://github.com/gridonic/dastro/compare/v1.1.3...v1.1.4)

- add netlify backup function handler
- add system debug info endpoint

### [1.1.3](https://github.com/gridonic/dastro/compare/v1.1.2...v1.1.3)

- Dependency updates

### [1.1.2](https://github.com/gridonic/dastro/compare/v1.1.1...v1.1.2)

- dato fetch: allow to override excludeInvalid
- update dependencies
- now copies cursor rules defined in dastro to local project after upgrade
- **CHORE** update fetching global navigation to not exclude invalid values

### [1.1.1](https://github.com/gridonic/dastro/compare/v1.1.0...v1.1.1)

- Allow to deactivate ssl in dev mode
- Add .node-version
- Add some chalk to cli

### [1.1.0](https://github.com/gridonic/dastro/compare/v1.0.9...v1.1.0)

- Add lodash and alpine js (alpine must still be activated in projects config)
- For now, always use locales without their variants in urls (that means, only one language variant is allowed for now)
- Update dependencies
- **BREAKING:** You must add the `routingStrategy` variable to your dastro config. set it to `prefix-except-default` to keep the same strategy as before

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
