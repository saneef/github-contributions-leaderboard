// From https://github.com/paulmillr/top-github-users

var Batch = require('batch');
var request = require('superagent');

exports.batchGet = function (urls, progressback, callback) {
	var batch = new Batch();
	batch.concurrency(5);
	urls.forEach(function (url) {
		batch.push(function (done) {
			request
				.get(url)
				.set('User-Agent', 'curl/7.24.0 (x86_64-apple-darwin12.0) libcurl/7.24.0 OpenSSL/0.9.8r zlib/1.2.5')
				.end(function (error, response) {
					console.log(url);
					if (error) {
						throw new Error(error);
					}

					if (response.error) {
						if (response.status === 404) {
							done();
						} else {
							throw [response.error, response.text].join('\n');
						}
					}
					var result;
					try {
						result = progressback(response.text);
					} catch (err) {
						error = err;
					}
					done(error, result);
				});
		});
	});

	batch.end(function (error, all) {
		if (error) {
			throw new Error(error);
		}

		callback(all);
	});
};
