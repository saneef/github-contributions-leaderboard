import browserSync from 'browser-sync';
import gulp from 'gulp';
import path from 'path';
import browserify from 'browserify';
import sourceStream from 'vinyl-source-stream';
import runSequence from 'run-sequence';
import del from 'del';

import plugins from 'gulp-load-plugins';

const $ = plugins();

let isBuild = false;

let paths = {
	src: {
		stylesheets: './client/scss',
		scripts: './client/scripts',
		views: './views',
		data: './data'
	},
	dest: {
		public: './public',
		stylesheets: './public/stylesheets',
		scripts: './public/scripts',
		server: './dist'
	}
};

gulp.task('stylesheets', function () {
	let postcssPlugins = [
		require('autoprefixer')
	];

	if (isBuild) {
		postcssPlugins.push(require('cssnano')());
	}

	return gulp.src(path.join(paths.src.stylesheets, '**/*.scss'))
		.pipe($.print())
		.pipe($.plumber())
		.pipe($.sourcemaps.init())
		.pipe($.if(!isBuild, $.sourcemaps.init()))
		.pipe($.sass.sync({
			outputStyle: 'expanded',
			precision: 10,
			includePaths: ['./node_modules']
		}).on('error', $.sass.logError))
		.pipe($.postcss(postcssPlugins))
		.pipe($.if(!isBuild, $.sourcemaps.write()))
		.pipe(gulp.dest(paths.dest.stylesheets))
		.pipe($.if(browserSync.active, browserSync.stream({once: true})));
});

gulp.task('client-scripts', function () {
	let browserifyOpts = {
		entries: [path.join(paths.src.scripts, 'app.js')],
		// Source maps only on dev
		debug: !isBuild
	};

	return browserify(browserifyOpts)
		.transform('babelify')
		.bundle()
		.pipe(sourceStream('bundle.js'))
		.pipe($.plumber())
		.pipe(gulp.dest(paths.dest.scripts))
		.pipe($.if(browserSync.active, browserSync.stream({once: true})));
});

gulp.task('server-scripts', function () {
	return gulp.src([
		path.join('./app.js'),
		path.join('./indexer.js'),
		path.join('./bin/*'),
		path.join('./routes/**/*.js'),
		path.join('./lib/**/*.js')
	], {
		base: path.join('.')
	})
	.pipe($.plumber())
	.pipe($.babel())
	.pipe(gulp.dest(paths.dest.server));
});

gulp.task('lint:js', function () {
	return gulp.src([
		path.join('./bin/www'),
		path.join('./*.js'),
		path.join('./client/**/*.js'),
		path.join('./routes/**/*.js'),
		path.join('./lib/**/*.js')
	])
		.pipe($.plumber())
		.pipe($.xo());
});

gulp.task('nodemon', function () {
	return $.nodemon({
		ignore: [
			'client',
			'views',
			'public'
		],
		exec: path.join('./node_modules/babel-cli/bin/babel-node.js'),
		script: './bin/www'
	}).on('restart', () => {
		console.log('restarted.');
	});
});

gulp.task('optimizeAssets', function () {
	// Cannot be include in 'client-scripts'
	// since if include it gives error

	return gulp.src(path.join(paths.dest.scripts, '*.js'))
		.pipe($.uglify())
		.pipe(gulp.dest(paths.dest.scripts));
});

gulp.task('copy-files', function () {
	return gulp.src([
		path.join(paths.dest.public, '**/*'),
		path.join(paths.src.data, '**/*'),
		path.join(paths.src.views, '**/*')
	], {
		base: path.join('.')
	})
	.pipe(gulp.dest(paths.dest.server));
});

gulp.task('watch', function () {
	browserSync.init({
		port: 9001,
		ui: {
			port: 9002
		}
	});

	gulp.watch([path.join(paths.src.stylesheets, '**/*.scss')], ['stylesheets']);
	gulp.watch([path.join(paths.src.scripts, '**/*.{js,jsx}')], ['client-scripts']);
	gulp.watch([
		path.join('./bin/www'),
		path.join('./*.{js,jsx}'),
		path.join('./client/**/*.{js,jsx}'),
		path.join('./routes/**/*.{js,jsx}')
	], ['lint:js']);
	gulp.watch([path.join(paths.src.views, '**/*.hbs')]).on('change', browserSync.reload);
});

gulp.task('clean', del.bind(null, ['dist']));

gulp.task('serve', function () {
	// Enable all exetasi debug logs
	process.env.DEBUG = 'github-contributions-leaderboard:*';

	return gulp.start([
		'lint:js',
		'client-scripts',
		'stylesheets',
		'watch',
		'nodemon'
	]);
});

gulp.task('build', function () {
	isBuild = true;

	return runSequence(
		['clean'],
		[
			'client-scripts',
			'stylesheets'
		],
		[
			'optimizeAssets'
		],
		[
			'server-scripts',
			'copy-files'
		]
	);
});

gulp.task('default', ['build']);
