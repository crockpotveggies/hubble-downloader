var fs = require('fs')
var request = require('request')
var syncRequest = require('sync-request')
var args = require('args')

// command line args
args
	.option('size', 'The number of concurrent file downloads', 96)
	.option('from', 'Cursor to a specific image in results', 0)
	.option('output', 'Location to put images', './data')

const flags = args.parse(process.argv)
const outputImgDir = flags.output+'/images'

// setup
if(!fs.existsSync(flags.output)) {
	fs.mkdirSync(flags.output)
}
if(!fs.existsSync(outputImgDir)) {
	fs.mkdirSync(outputImgDir)
}


// the nasa internal API
var apiSearch = function(size, from) {
	var baseUrl = 'https://www.nasa.gov/api/2/ubernode/_search?size={{size}}&from={{from}}&sort=promo-date-time%3Adesc&q=((ubernode-type%3Aimage)%20AND%20(missions%3A3451))'
	baseUrl = baseUrl.replace('{{size}}', size)
	baseUrl = baseUrl.replace('{{from}}', from)
	return baseUrl
}

var apiStatic = function(imageUri) {
	var staticDomain = 'https://www.nasa.gov/sites/default/files/'
	imageUri = imageUri.replace('public://', staticDomain)
	return imageUri
}

// download image
var downloadImageToUrl = (url, filename, callback) => {

    var client = http;
    if (url.toString().indexOf("https") === 0){
      client = https;
     }

    client.request(url, function(response) {                                        
      var data = new Stream();                                                    

      response.on('data', function(chunk) {                                       
         data.push(chunk);                                                         
      });                                                                         

      response.on('end', function() {                                             
         fs.writeFileSync(filename, data.read());                               
      });                                                                         
   }).end();
};


// callback for recursive fetching
var processAndFetch = function (body) {
	// parse and iterate
	let response = JSON.parse(body)
	let hits = response.hits.hits

	for(var i = 0; i < hits.length; i++) {
		let hit = hits[i]
		els = hit._source['master-image'].uri.split("/")
		let fileName = els[els.length-1]

		// write image file
		console.log(apiStatic(hit._source['master-image'].uri))
		let file = syncRequest('GET', apiStatic(hit._source['master-image'].uri))
		let outputFile = outputImgDir+'/'+fileName

		if(file.statusCode < 300) {
			fs.writeFileSync(outputFile, file.getBody(), 'binary', function(err) {
				throw new Error('Failed to write file to '+outputFile)
			})

			let metaData = hit._source['master-image'].uri+'|'+hit._source.title+'|'+hit._source['master-image'].height+'|'+hit._source['master-image'].width+'\n'
			fs.appendFileSync(flags.output+'/images.csv', metaData, function (err) {
			  if (err) throw err;
			});

		} else {
			console.log('Skipped image '+outputFile+': received bad status code')
		}
	}

  cursor += flags.size
  console.log('Cursor is ', cursor)
  download()
}

var download = function() {
	let response = syncRequest('GET', apiSearch(flags.size, cursor))
	
	if(response.statusCode > 300) {
		console.log('Download failed at image ', cursor)
		console.log('BODY ', response.getBody())
		throw new Error('Download failed')
	}
	
	processAndFetch(response.getBody())
}

// download images
console.log('Starting download...')
var cursor = flags.from
download()