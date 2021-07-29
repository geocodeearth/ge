[BETA] This repo is still a work-in-progress.

## Installation

```bash
npm i -g @geocodeearth/ge
```

## CLI

```bash
ge <cmd> [args]

Commands:
  ge batch  batch geocoding tools

Options:
      --version  Show version number                                   [boolean]
  -v, --verbose  enable verbose logging               [boolean] [default: false]
      --help     Show help                                             [boolean]
```

## Authentication

In order to authenticate with the Geocode Earth servers you must have a valid API key from Geocode Earth.
You can sign up for a free key at https://geocode.earth/ or visit https://app.geocode.earth/dashboard to find an existing key.

You must `export` your API key in your shell so it is available as an environment variable:

```bash
export GE_API_KEY=ge-xxxxxxxxxxxxxxxx
```

You can check that it's been set correctly with the `env` command.

#### Batch CSV Geocoding

```bash
ge batch csv <file>

append geocoded columns to a CSV file

Positionals:
  file  location of the input CSV file.                      [string] [required]

Options:
      --version      Show version number                               [boolean]
  -v, --verbose      enable verbose logging           [boolean] [default: false]
      --help         Show help                                         [boolean]
  -p, --param        Define a parameter.                                [string]
  -t, --template     Define a template.                                 [string]
      --endpoint     API endpoint to query.     [string] [default: "/v1/search"]
      --concurrency  Maximim queries per-second.           [number] [default: 5]
```

##### Preparing the CSV file

Your input CSV must contain a header row on the first line with column names.
Please ensure that the file is valid before continuing.

##### Working with streams

The basic usage is `ge batch csv <file>` where `<file>` can be either a file or a stream.

You can accept a CSV on `stdin` as such:

```bash
cat input.csv | ge batch csv /dev/stdin
```

and capture the updated CSV on `stdout` as such:

```bash
cat input.csv | ge batch csv /dev/stdin | xsv table
```

##### Debugging

You can increase the verbosity for debugging purposes.
Logs are written to `stderr`:

```bash
ge batch csv \
  --verbose
```

##### Parameter templating

The basic usage is `ge batch csv <file>`, but this alone will not yeild results.
You'll first need to define a mapping from the field names in your CSV to HTTP request parameters which will be sent to Geocode Earth.

This can be achieved using a pair of flags, `-p` to name the parameter and `-t` to define a template for the parameter value.

For example the following will set the querystring parameter `text` to equal `1 Main Street, London`, assuming that the CSV contains columns named `number`, `street` and `city`:

```bash
ge batch csv \
  -p 'text' \
  -t '${row.number} ${row.street}, ${row.city}'
```

We use the [lodash template engine](https://lodash.com/docs/4.17.15#template) and pass it a single variable `row` which contains the data for the current row in the CSV file.

You can add multiple pairs of parameters, please take care to match each `-p` with a `-t`.

note: be careful to use single-quotes `'` instead of double-quotes `"` on the command-line to avoid your shell interpolating the string.

##### Search Example

```batch
ge batch csv \
  --endpoint '/v1/search' \
  --concurrency 20 \
  -p 'text' -t '${row.NUMBER} ${row.STREET}, ${row.CITY}' \
  -p 'boundary.country' -t 'NZ' \
  /data/oa/nz/countrywide.csv
```

##### Structured Search Example

```batch
ge batch csv \
  --endpoint '/v1/search/structured' \
  --concurrency 20 \
  -p 'address' -t '${row.NUMBER} ${row.STREET}' \
  -p 'city' -t '${row.CITY}' \
  -p 'boundary.country' -t 'NZ' \
  /data/oa/nz/countrywide.csv
```

##### Reverse Example

```batch
ge batch csv \
  --endpoint '/v1/reverse' \
  --concurrency 20 \
  -p 'point.lat' -t '${row.LAT}' \
  -p 'point.lon' -t '${row.LON}' \
  /data/oa/nz/countrywide.csv
```

##### Autocomplete Example

```batch
ge batch csv \
  --endpoint '/v1/autocomplete' \
  --concurrency 20 \
  -p 'text' -t '${row.NUMBER} ${row.STREET}, ${row.CITY}' \
  -p 'focus.point.lat' -t '${row.LAT}' \
  -p 'focus.point.lon' -t '${row.LON}' \
  -p 'boundary.country' -t 'NZ' \
  /data/oa/nz/countrywide.csv
```
