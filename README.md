# hubble-downloader
NodeJS utility for downloading hi-res hubble images.

## Install
You will need NodeJS version `10` or higher. Clone this repository to your local machine, then from the root of the repo run `npm install`.

## Usage
The downloader is a single script. An example command is:

```shell
node downloader.js --output /path/to/place/data --size 4 --from 0
```

where `size` is the number of concurrent requests and `from` is the starting place of the search results cursor.
