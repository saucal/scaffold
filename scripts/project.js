/**
 * External dependencies
 */
const path = require( 'path' );
const { renameSync, existsSync, readFileSync } = require( 'fs' );
const downloadGH = require( 'download-git-repo' );
const rimraf = require( 'rimraf' );
const replace = require( 'replace' );
const slugify = require( 'slugify' );
const mkdirp = require('mkdirp');
const { prompt } = require('enquirer');

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

downloadGH( "saucal/project-gulp-boilerplate#" + data.branch, sourcePath, async function(err) {
	if ( err ) {
		console.error( "Couldn't download from GitHub. Maybe the branch \"" + data.branch + "\" doesn't exist?" );
		process.exit( 1 );
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

	await walkDirectory( sourcePath, async function( f ) {
		let relative = path.relative( sourcePath, f );
		let replacePath = path.join( targetPath, relative );

		if ( existsSync( replacePath ) && ! readFileSync(f).equals( readFileSync( replacePath ) ) ) {
			let response;
			try {
				response = await prompt({
					type: 'confirm',
					name: 'question',
					message: 'File ' + relative + ' exists and is different. Replace?',
					initial: false,
				});
			} catch {
				rimraf.sync( sourcePath );
				return process.exit( 1 );
			}

			if ( response ) {
				rimraf.sync( replacePath );
			} else {
				return;
			}
		}
		mkdirp.sync( path.dirname( replacePath ) );
		renameSync( f, replacePath );

		return replacePath;
	} );

	rimraf.sync( sourcePath );
} );
