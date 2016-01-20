# github-contributions-leaderboard

[![Build Status](https://travis-ci.org/razorfish-tech/github-contributions-leaderboard.svg?branch=master)](https://travis-ci.org/razorfish-tech/github-contributions-leaderboard)

## Data

Data fetching is based on [paulmillr](https://github.com/paulmillr)’s [git.io/top](http://git.io/top) project.

## Development

### Setting up environment

- `$ npm install gulp babel-cli` to install gulp and babel binaries

- `$ npm install`
- `$ gem install scss_lint` [optional]

### Developing

#### App
- `$ gulp serve` will run local development server; and you can access the app on http://localhost:3000.

#### Refreshing the data

- Locally you need to run `$ babel-node indexer.js` to refresh the data. 


