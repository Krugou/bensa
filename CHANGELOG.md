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
