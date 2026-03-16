# [1.1.0](https://github.com/Krugou/bensa/compare/v1.0.3...v1.1.0) (2026-03-16)

### Bug Fixes

- add firestore deployment to CI/CD and update rules ([911b0ab](https://github.com/Krugou/bensa/commit/911b0ab0e7371297838ab6f9e5b2d404035ee328))
- **bot:** improve geocoding accuracy and add city verification warning ([c4e6f97](https://github.com/Krugou/bensa/commit/c4e6f97523b528484851c10efea874ad20826ca5))
- **chart:** increase fetch limit for history fallback to show 7+ days ([f31b20e](https://github.com/Krugou/bensa/commit/f31b20edce7fc12004182a52645bcde36dc984a7))
- **ci:** use rebase before pushing prices to avoid non-fast-forward errors ([061810f](https://github.com/Krugou/bensa/commit/061810fe1aa2c41d0b38fc77f0c27b8ea9a853a9))
- **ci:** use w9jds/firebase-action for more robust firestore deployment ([cc4b6f7](https://github.com/Krugou/bensa/commit/cc4b6f775c32942816e020183a4dd5d46d921806))
- clean station names/addresses, suppress stale data styling, fix nearest cheap scroll ([0050dd8](https://github.com/Krugou/bensa/commit/0050dd8ea9436cdcc4f407c472804ef33dcd9aeb))
- resolve 404 errors by using relative paths and robust basename detection ([a867aa8](https://github.com/Krugou/bensa/commit/a867aa8d45cb54fe74295bdd123ff1160c653ad1))
- resolve firestore permissions and optimize bot geocoding cache ([16103ac](https://github.com/Krugou/bensa/commit/16103ac1ea3178de18e83f21d5f18289a8339050))
- resolve firestore permissions with simpler rules and better CI integration testing ([3bd7006](https://github.com/Krugou/bensa/commit/3bd7006c401bb713c8e4c3c703258043517df2b4))
- **ui:** hide directions/gps if coords are 0,0 and fix S11 station ([43d6851](https://github.com/Krugou/bensa/commit/43d685196d977200ea9dbee5a2b88c7d4476ddd4))
- update firestore rules to allow public read access ([eb5ce1e](https://github.com/Krugou/bensa/commit/eb5ce1e3870d33258fcef69c3f6b088711237e8a))
- **web:** correct latLngBounds typing in StationMap ([8eee18e](https://github.com/Krugou/bensa/commit/8eee18ecce6899ac9ba1ff87e03aa15b345f9283))
- **web:** dark background for brand selector and improved nearest cheap logic ([c191bbe](https://github.com/Krugou/bensa/commit/c191bbe86e757bbecbc8aa8a12c4d3649d28c044))
- **web:** fix RichList distance filtering and pass calculated distances ([03579d5](https://github.com/Krugou/bensa/commit/03579d535e2ffbcf025ad793327ccfb3e9ff6876))
- **web:** prevent text overflow in RichList and StationCard using break-all ([82fdf5e](https://github.com/Krugou/bensa/commit/82fdf5ea1311401b9c7ced3285f6d18fc5186c7d))

### Features

- add 50km distance limit to practical cheap station finder ([700466a](https://github.com/Krugou/bensa/commit/700466a0708eb273f90b2bb7e2921edef577fcf0))
- add caching, filter zero prices, and handle firebase quota errors ([ccf2b40](https://github.com/Krugou/bensa/commit/ccf2b401716b8af5a4234e713bf1b1be46e5628f))
- add cookie consent banner and conditional analytics initialization ([f04e776](https://github.com/Krugou/bensa/commit/f04e77624dd59b4ae34d66c12cf43a1e723b6216))
- add locale slug support (e.g., /fi, /en) and fix tests ([68365a3](https://github.com/Krugou/bensa/commit/68365a345845efdb2c2ba30231bd186cfa142c3d))
- add quick actions for nearest cheap station and finalize dark mode ([52c7561](https://github.com/Krugou/bensa/commit/52c7561b7591b6b8b50366a341467e16ddc2f45d))
- add quota-themed quirky movie parodies to loading screen ([6946591](https://github.com/Krugou/bensa/commit/6946591e166598fa2f4cd9618397e0b3cdf76709))
- add randomized quirky loading quotes ([4c89365](https://github.com/Krugou/bensa/commit/4c8936586aaa0130b901b0bff7f30faf2c513809))
- add scrolling to station list ([3c34d22](https://github.com/Krugou/bensa/commit/3c34d222c5d59062071193a66d054ea493326b1d))
- **admin:** add station management to edit addresses ([f312fae](https://github.com/Krugou/bensa/commit/f312faec4102ad19a126fdae61eac4504f3ded26))
- **admin:** restrict dashboard to local dev and add GPS lock (userFixed) ([b7b3433](https://github.com/Krugou/bensa/commit/b7b343394b36f7311eef8c39a666584eeb9c5f61))
- **bot:** implement coordinate caching using Firestore to optimize geocoding ([b819e11](https://github.com/Krugou/bensa/commit/b819e11c68290eb1b4ecb1ba5da9792c39d88eb2))
- **bot:** record scraper runs in separate collection and update firestore rules ([1f645ab](https://github.com/Krugou/bensa/commit/1f645ab49f789930cc11996b2854335a35175e49))
- **chart:** add 7-day, 30-day, 1-year and all-time price trends with aggregated data ([bed54b4](https://github.com/Krugou/bensa/commit/bed54b4f26e1a54f4b3194a41380cb8365c574c9))
- **ci:** add client-side firebase connectivity test to pipeline ([8fb05dc](https://github.com/Krugou/bensa/commit/8fb05dc688f193a9b84163a0fb2a5754a3e26598))
- **ci:** add firebase connectivity test to pipeline ([d264fc4](https://github.com/Krugou/bensa/commit/d264fc41886666c79733ca211fcaf14c0dd32958))
- **core:** add RE85 support and localize chart dates ([f7a1222](https://github.com/Krugou/bensa/commit/f7a12227a828fd8e8d9299653f550ef278003826))
- expand scraper to more regions and add source links to prices ([7f4a6f2](https://github.com/Krugou/bensa/commit/7f4a6f2c11a00e50d4b646a12504464a76b0b803))
- finalize workspace synchronization ([8891ef3](https://github.com/Krugou/bensa/commit/8891ef3f43e8f93baaf1c84892627f429e527687))
- fix project configuration and enhance price history with hourly view ([bb9f4a8](https://github.com/Krugou/bensa/commit/bb9f4a83328341c2e911974544139a69077546ef))
- implement initial map auto-fit and better default zoom level ([b8c1272](https://github.com/Krugou/bensa/commit/b8c1272dc799d7c091de2dd07818fde16fd7c0e6))
- migrate to dark-only theme and remove redundant theme logic ([3507556](https://github.com/Krugou/bensa/commit/3507556f23183bece47ce5c17a6175b2f9ff8905))
- set default location to Espoo and filter distant stations ([3e9cb7f](https://github.com/Krugou/bensa/commit/3e9cb7fa3ca5ebfb01322d6eac3454467d480f21))
- **stations:** add sorting toggle for price and distance ([2f6acd7](https://github.com/Krugou/bensa/commit/2f6acd775c5ceaa2aa9ce8196f04bffda1046532))
- **ui:** add brand filter dropdown and support yksinkertainentila param ([4d4cdb5](https://github.com/Krugou/bensa/commit/4d4cdb5171bc2431478a3b7f7b21469e96375fa5))
- **ui:** add brand icons and support for manual brand management ([2388bee](https://github.com/Krugou/bensa/commit/2388beec4646fcde19a50a7534d22e94b7c97bf2))
- **ui:** add conditional repo link in footer for dev mode ([80b3924](https://github.com/Krugou/bensa/commit/80b3924019df82d94d672d051e77d6a0c881a61b))
- **ui:** add simplemode param to show only map and station list ([feafab8](https://github.com/Krugou/bensa/commit/feafab859fe2f09a554efc29afde1680b1b9315b))
- **ui:** optimize layout for wide screens with side-by-side panels and larger boxes ([e6fe45b](https://github.com/Krugou/bensa/commit/e6fe45bbe4866b865686a26f5ca9723b0d27f777))
- **web:** add favorites, savings calculator, theme toggle, rich list, and range circle ([7f1d871](https://github.com/Krugou/bensa/commit/7f1d8717676d2150665db1ace7f494bd0f8f8d28))
- **web:** add feature-flagged crowdsourcing placeholder modal ([8bf43f6](https://github.com/Krugou/bensa/commit/8bf43f6f20057b343828c87c25c5034db487c482))
- **web:** add per gallon pricing in small text for fun ([e51fc67](https://github.com/Krugou/bensa/commit/e51fc676ec567a6b840c70d505eff2832e2e0436))
- **web:** add weekday analysis and price gap alerts ([8aa9d8d](https://github.com/Krugou/bensa/commit/8aa9d8d44adc3f088300ef2dce4a80af8fc0b01a))
- **web:** update RichList to default to 50km and add toggle for all Finland ([61d1836](https://github.com/Krugou/bensa/commit/61d1836fe9cecc85af403ce439d0e2161e6ef9bc))

## [1.0.3](https://github.com/Krugou/bensa/compare/v1.0.2...v1.0.3) (2026-03-04)

### Bug Fixes

- **bot:** improve environment variable support and update README ([69a4169](https://github.com/Krugou/bensa/commit/69a416911b381061684c2c59302893fba03d9362))

## [1.0.2](https://github.com/Krugou/bensa/compare/v1.0.1...v1.0.2) (2026-03-04)

### Bug Fixes

- resolve asset loading errors and downgrade ESLint to v9 for compatibility ([8102fc4](https://github.com/Krugou/bensa/commit/8102fc4a0b55bc47102d4f58880c95a980ba1722))

## [1.0.1](https://github.com/Krugou/bensa/compare/v1.0.0...v1.0.1) (2026-03-04)

### Bug Fixes

- **bot:** ensure api directory exists and explicitly set projectId ([cd162d6](https://github.com/Krugou/bensa/commit/cd162d68247065fe3da03c6103bf4fcff34e4272))
- **bot:** improve projectId detection for Firestore initialization ([de0c258](https://github.com/Krugou/bensa/commit/de0c258b01a5b4207dc81f5d483b575c419d0674))

# 1.0.0 (2026-03-04)

### Bug Fixes

- ensure light mode overrides system dark preference in tailwind v4 ([090610b](https://github.com/Krugou/bensa/commit/090610bcbc60345f1abd5075c6d5848cf773e83b))
- resolve lint, tsc, and test errors in web and bot workspaces ([e9ee3d1](https://github.com/Krugou/bensa/commit/e9ee3d1d96f92fc45746d476a38150a312eef87f))
- resolve React 19 test hazard, fix bot build, and add architecture docs ([170c3ea](https://github.com/Krugou/bensa/commit/170c3ea330d497ac50bb76c4f803b9a0c7d8736e))

### Features

- add funny loading text and fix scraper bot dependencies/paths ([e83321c](https://github.com/Krugou/bensa/commit/e83321c0078f1fa734817f0cc3fcfb2883c482fe))
- add wacky animations ([d13f853](https://github.com/Krugou/bensa/commit/d13f85369b2e29c0b076d70e0fc3fc02bd51c874))
- implement historical price tracking in Firestore and fix vitest duplication ([d7505e4](https://github.com/Krugou/bensa/commit/d7505e4487e019ed31a5abf0d8c465e5ed2f1362))
- migrate gas price data to Firebase Firestore ([ad2a85f](https://github.com/Krugou/bensa/commit/ad2a85fcb665fab0b1119ae9019e89da951f73b1))
- show relative time for fuel price updates ([9b7ba5c](https://github.com/Krugou/bensa/commit/9b7ba5cf6392035a41fef941fafddf79a7c01b28))

# Changelog

All notable changes to the Bensa Gas Price Tracker project will be documented in this file.

## [1.0.0] - Initial Release

- Converted Aurora Watcher architecture to Bensa Gas Price Tracker.
- Implemented real-time gas price monitoring interface.
- Added Haversine-based nearest cheap station discovery.
- Fully localized in Finnish and English.
