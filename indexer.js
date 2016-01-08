import cheerio from 'cheerio';
import moment from 'moment';
import fs from 'fs';
import logger from 'debug';
import utils from './lib/utils';

const debug = logger('github-contributions-leaderboard:indexer');

let stats = {
	updatedOn: undefined,
	users: []
};

function getStats(html) {
	let $;
	let byProp;
	let getFollowers;
	let getInt;
	let getOrgName;
	let userStats;

	$ = cheerio.load(html);

	byProp = function (field) {
		return $('[itemprop=\'' + field + '\']');
	};

	getInt = function (text) {
		return parseInt(text.replace(',', ''), 10);
	};

	getOrgName = function (item) {
		return $(item).attr('aria-label');
	};

	getFollowers = function () {
		let multiplier;
		let text;

		text = $('.vcard-stats > a:nth-child(1) > .vcard-stat-count').text().trim();
		multiplier = text.indexOf('k') > 0 ? 1000 : 1;
		return (parseFloat(text)) * multiplier;
	};

	userStats = {
		name: byProp('name').text().trim(),
		login: byProp('additionalName').text().trim(),
		location: byProp('homeLocation').text().trim(),
		gravatar: byProp('image').attr('href'),
		followers: getFollowers(),
		organizations: $('#site-container > div > div > div.column.one-fourth.vcard > div.clearfix > a').toArray().map(getOrgName),
		contributions: getInt($('#contributions-calendar > div:nth-child(3) > span.contrib-number').text()),
		contributionsStreak: getInt($('#contributions-calendar > div:nth-child(4) > span.contrib-number').text()),
		contributionsCurrentStreak: getInt($('#contributions-calendar > div:nth-child(5) > span.contrib-number').text())
	};

	stats.users.push(userStats);

	return userStats;
}

function writeStats(filename, stats) {
	fs.writeFileSync(filename, JSON.stringify(stats, null, 2) + '\n');
	debug(`Saved to ${filename}`);
}

function prepareStats() {
	const users = require('./users.json');

	const urls = users.map(function (user) {
		return `https://github.com/${user}`;
	});

	utils.batchGet(urls, getStats, function () {
		stats.updatedOn = moment();

		writeStats('./public/datasets/stats.json', stats);

		debug(`Updated stats of ${stats.users.length} users`);
	});

}

prepareStats();
