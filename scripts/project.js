/**
 * External dependencies
 */
const path = require( 'path' );
const { renameSync, existsSync } = require( 'fs' );
const downloadGH = require( 'download-git-repo' );
const rimraf = require( 'rimraf' );
const replace = require( 'replace' );
const slugify = require( 'slugify' );
const mkdirp = require('mkdirp');

/**
 * Internal dependencies
 */
const { getArgFromCLI, walkDirectory } = require( '../utils' );

let data = {
	branch: getArgFromCLI( '--branch' ) || 'master',
	name: getArgFromCLI( '--name' ) || '',
	slug: getArgFromCLI( '--slug' ) || '',
	uri: getArgFromCLI( '--uri' ) || '',
};

let projectName = String(data.name).length ? data.name : 'Amazing Project';
let projectSlug = String(data.slug).length ? String(data.slug).toLowerCase() : slugify( projectName ).toLowerCase();

let sourcePath = path.join( process.cwd(), 'source-' + (new Date()).getTime() );

let targetPath = process.cwd();

rimraf.sync( sourcePath );

downloadGH( "saucal/project-gulp-boilerplate#" + data.branch, sourcePath, function(err) {
	if ( err ) {
		throw err;
	}

	let replacements = [
		[ "Project Name", projectName ],
		[ "project-name", projectSlug ]
	];

	replacements.map( function( rule ) {
		replace( {
			regex: rule[0],
			replacement: rule[1],
			paths: [ sourcePath ],
			recursive: true,
			silent: true,
		} );
	} );

	walkDirectory( sourcePath, function( f ) {
		let relative = path.relative( sourcePath, f );
		let replacePath = path.join( targetPath, relative );

		if ( existsSync( replacePath ) ) {
			rimraf.sync( replacePath );
		}
		mkdirp.sync( path.dirname( replacePath ) );
		renameSync( f, replacePath );

		return replacePath;
	} );

	rimraf.sync( sourcePath );
} );
