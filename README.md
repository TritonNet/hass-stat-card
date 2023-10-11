# Home Assistant Water Parameter Stat Card
Home Assistant - Water Parameter Stat Card

![GitHub release (latest by date)](https://img.shields.io/github/v/release/tritonnet/hass-water-param-stat-card)

![GitHub All Releases](https://img.shields.io/github/downloads/tritonnet/hass-water-param-stat-card/total)

![GitHub](https://img.shields.io/github/license/tritonnet/hass-water-param-stat-card)

![Card View](https://github.com/TritonNet/hass-water-param-stat-card/blob/master/docs/images/card_view.PNG?raw=true)

![Card View](https://github.com/TritonNet/hass-water-param-stat-card/blob/master/docs/images/card_new_entry_view.PNG?raw=true)

Configuration Example:
```yaml
type: custom:water-param-stat-card
title: Calcium
stats:
  - title: Last Reading
    value: >-
      {{ states('input_number.calcium_reading') | string + ' ' +
      state_attr('input_number.calcium_reading', 'unit_of_measurement') | string
      }}
  - title: Last Reading on
    value: >-
      {{ ((as_timestamp(now()) -
      state_attr('input_datetime.calcium_last_read','timestamp')) / 86400) | int
      }} days ago
  - title: Max
    value: 580ppt
    readonly: true
  - title: Min
    value: 520ppt
    readonly: true
charts:
  guage: >-
    https://grafana.tritonnet.nz/d-solo/b126f26e-5e73-42c3-80d4-1bd4a342c93d/main-aquarium-calcium-reading?orgId=1&panelId=2
  timeseries: >-
    https://grafana.tritonnet.nz/d-solo/b126f26e-5e73-42c3-80d4-1bd4a342c93d/main-aquarium-calcium-reading?orgId=1&panelId=1
new_entry:
  enabled: true
  label: New Calcium Reading
  entity: input_number.calcium_reading

```

## Options

| Name | Type | Requirement | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:water-param-stat-card`
| title | string | **Optional** | Card title
| stats | list | **Optional** | List of stats to display
| charts | list | **Optional** | List of charts to display
| new_entry | object | **Optional** | New entry button

### Stats Options

| Name | Type | Requirement | Description
| ---- | ---- | ------- | -----------
| title | string | **Required** | Stat title
| value | string | **Required** | Stat value
| readonly | boolean | **Optional** | Stat value is readonly

### Charts Options

| Name | Type | Requirement | Description
| ---- | ---- | ------- | -----------
| guage | string | **Optional** | URL to guage chart
| timeseries | string | **Optional** | URL to timeseries chart

### New Entry Options

| Name | Type | Requirement | Description
| ---- | ---- | ------- | -----------
| enabled | boolean | **Optional** | Enable new entry button
| label | string | **Optional** | New entry button label
| entity | string | **Optional** | New entry button entity

## Installation

### Step 1

Install `water-param-stat-card` by copying `water-param-stat-card.js`from this repo to `<config directory>/www/water-param-stat-card.js` on your Home Assistant instanse.

**Example:**

```bash
wget https://raw.githubusercontent.com/tritonnet/hass-water-param-stat-card/master/card.js
mv card.js /config/www/
```

### Step 2

Link `water-param-stat-card` inside you `ui-lovelace.yaml`.

```yaml
resources:
  - url: /local/card.js?v=1.4
    type: module
```

### Step 3

Add a custom element in your `ui-lovelace.yaml`

```yaml
type: custom:water-param-stat-card
title: Calcium
stats:
  - title: Last Reading
    value: >-
      {{ states('input_number.calcium_reading') | string + ' ' +
      state_attr('input_number.calcium_reading', 'unit_of_measurement') | string
      }}
  - title: Last Reading on
    value: >-
      {{ ((as_timestamp(now()) -
      state_attr('input_datetime.calcium_last_read','timestamp')) / 86400) | int
      }} days ago
  - title: Max
    value: 580ppt
    readonly: true
  - title: Min
    value: 520ppt
    readonly: true
charts:
  guage: >-
    https://grafana.tritonnet.nz/d-solo/b126f26e-5e73-42c3-80d4-1bd4a342c93d/main-aquarium-calcium-reading?orgId=1&panelId=2
  timeseries: >-
    https://grafana.tritonnet.nz/d-solo/b126f26e-5e73-42c3-80d4-1bd4a342c93d/main-aquarium-calcium-reading?orgId=1&panelId=1
new_entry:
  enabled: true
  label: New Calcium Reading
  entity: input_number.calcium_reading
```