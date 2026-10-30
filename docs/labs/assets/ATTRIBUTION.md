# Map data attribution

## Time zone boundaries

`timezones.geojson` is derived from **Timezone Boundary Builder, release 2026e**, using the complete land-boundary dataset (`timezones.geojson.zip`).

- Source: https://github.com/evansiroky/timezone-boundary-builder/releases/tag/2026e
- Original download: https://github.com/evansiroky/timezone-boundary-builder/releases/download/2026e/timezones.geojson.zip
- Copyright/attribution: Timezone Boundary Builder contributors and OpenStreetMap contributors.
- Data licence: Open Data Commons Open Database License (ODbL) 1.0: https://opendatacommons.org/licenses/odbl/1-0/
- This derived database is distributed under the same ODbL 1.0 licence.
- Changes: simplified with Shapely's topology-preserving simplification at 0.08 degrees; retained all 419 IANA `tzid` features.

These boundaries are approximate teaching/map data, not legal boundary evidence. Small islands and narrow boundary details may be distorted or omitted at the displayed scale. Ocean zones are not included. A zone's UTC offset depends on the selected date and daylight saving rules, not its map colour or longitude. Use the browser's time zone database to calculate dates/times.

## World land outlines

`world-land.geojson` is Natural Earth's **1:110m land** layer, downloaded from:
https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson

Natural Earth data is public domain: https://www.naturalearthdata.com/about/terms-of-use/


## City search

`cities.json` is a GeoNames cities15000 extract downloaded 30 October 2026. It includes cities with at least 50,000 people, capitals, and all Australian/New Zealand entries in that extract (12,766 places). Fields: city, country code, administrative region, IANA time zone, longitude, latitude, population. Region names come from admin1CodesASCII.

Source: https://download.geonames.org/export/dump/
Attribution: GeoNames, https://www.geonames.org/ — Creative Commons Attribution (https://creativecommons.org/licenses/by/4.0/).
