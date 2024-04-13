# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.0.10] - 2024-04-13

### Added

### Changed

- Renamed project to myntbreyta.is

### Removed

- Settings page, which broke after currency json restructure

### Fixed

- Cache times for static files, set cache to 1 year
- Currency select/calc logic after json restructure

## [v0.0.9] - 2023-08-30

### Added

- This changelog (#29)
- Number format preference to settings (#28)

### Changed

- App language (#26)

### Fixed

- Input box CSS for better UX (#24)
- GitHub workflow, prevent deployment from deleting currency rates (#21)

## [v0.0.8] - 2023-08-26

### Changed

- Updated GitHub workflow
- Simplified form input for better native support, e.g. paste (#18)

### Removed

- Dark mode support

## [v0.0.7] - 2022-12-25

### Added

- App reset functionality under Settings

### Fixed

- Service worker caching for currency rates (#17)

## [v0.0.6] - 2022-07-29

### Added

- Show dates of currency rates in app (#1)
- Preload all static assets (#5)
- Service worker, with offline + cache support (#2)

## [v0.0.5] - 2022-07-23

### Changed

- Currency number formatting, use browser Intl API to format

### Fixed

- Site height in mobile

## [v0.0.4] - 2022-07-23

### Added

- Document direction
- Settings page

### Fixed

- Currency data

### Changed

- Moved Js/CSS to their own files + update build system

## [v0.0.3] - 2022-07-21

### Added

- Description to currency input
- Pattern to validate form input

### Fixed

- Prevent mobile scroll on input focus
- JavaScript if input is NaN

## [v0.0.2] - 2022-07-21

### Changed

- Default currency value

### Fixed

- CloudFront invalidation step in GitHub workflow
- Site min-height for mobile devices

## [v0.0.1] - 2022-07-21

### Added

- README about project
- Currency conversion
- Mobile friendly HTML/CSS
- Gulp build system to minify static files
- Functionality to fetch latest currency rates
- GitHub workflow to deploy web app
