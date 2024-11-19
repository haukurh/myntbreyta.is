# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.0.18] - 2024-11-20

### Changed

- Inline styles in error.html for performance

### Fixed

- Resolving error.html in dev server

## [v0.0.17] - 2024-11-17

### Changed

- Increase s-maxage in cache-control header for HTML
- Rename 404.html to error.html

## [v0.0.16] - 2024-08-02

### Added

- Currencies CHF & CZK

### Changed

- Remove userSelectedCurrencies from local storage and only use popular list

### Fixed

- Add missing description for currency PLN

## [v0.0.15] - 2024-08-02

### Added

- More currencies; DKK, NOK & PLN

## [v0.0.14] - 2024-05-07

### Added

- Favicon
- Arrow to currency selector #4
- Keywords meta tag like it's 2002
- 404 page

### Changed

- Visible border color to currency input

### Fixed

- Currency description in label

## [v0.0.13] - 2024-05-05

### Added

- Development server
- Revision hash to assets filenames for cache bursting
- Clear browser cache on service worker install
- Set 's-maxage' to week in cache-control on HTML documents

### Changed

- Gulpfile to ECMAscript module + refactor
- Switch out basic gulp packages for "in-house" logic
- Cache strategy to stale-while-revalidate except for objects with 'expires' header

### Fixed

- Yarn script name of prettier script
- Only cache 'OK' GET responses

## [v0.0.12] - 2024-04-23

### Added

- Added prettier to project for code formatting
- Meta description to project for SEO

### Changed

- Theme color, because of color contrast
- Display app name in header
- actions in GitHub workflow
- Page title to app name
- Default currency from 'AUD' to 'EUR'

### Fixed

- Input overflow on Android #35

## [v0.0.11] - 2024-04-16

### Added 

- Have service worker honor 'expires' headers from origin
- Create a custom cache store for each app version

### Removed

- Logic within app storing currency rates, now everything relies on browser cache

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
