/**
 * External dependencies
 */
const path = require( 'path' );
const { readdirSync, statSync, renameSync, rename } = require( 'fs' );
const downloadGH = require( 'download-git-repo' );
const rimraf = require( 'rimraf' );
const replace = require( 'replace' );
const slugify = require( 'slugify' );

/**
 * Internal dependencies
 */
const { getArgFromCLI } = require( '../utils' );

let data = {
	branch: getArgFromCLI( '--branch' ) || 'master',
	name: getArgFromCLI( '--name' ) || '',
	slug: getArgFromCLI( '--slug' ) || '',
	uri: getArgFromCLI( '--uri' ) || '',
	shortpkg: getArgFromCLI( '--short' ) || '',
	singleton: getArgFromCLI( '--singleton' ) || '',
	author: {
		name: 'SAU/CAL',
		uri: 'https://saucal.com',
		email: 'info@saucal.com',
	}
};

const capitalize = function( name ) {
	var newName = "";
	pieces = name.split(' ');
	pieces.forEach(function(word){
		newName += word.charAt(0).toUpperCase() + word.slice(1) + ' ';
	});
	return newName.trim();
}

const packagify = function(name){
	return capitalize(name.replace(/-/gi, ' ')).replace(/ /gi, '_');
}

const shortify = function( name ) {
	var newName = "";
	var pieces = capitalize( name ).split( ' ' );
	var last = pieces.pop();
	pieces.forEach(function(word){
		newName += word.charAt(0);
	});
	newName += last;
	return newName;
}

const walkDirectory = function(dir, cb) {
	cb = cb || ( (f) => f );
	var files = readdirSync(dir)
		.map( ( f ) => path.join( dir, f ) )
		.map( ( f ) => statSync( f ).isDirectory() ? walkDirectory( f ) : f )
		.flat()
		.map( cb );
	return files;
};

let pluginName = String(data.name).length ? data.name : 'Amazing Plugin';
let pluginSlug = String(data.slug).length ? String(data.slug).toLowerCase() : slugify( pluginName ).toLowerCase();
let pluginURI = String(data.uri).length ? data.uri : 'https://saucal.com/' ;
let pluginAuthor = String(data.author.name).length ? data.author.name : 'SAU/CAL' ;
let pluginAuthorURI = String(data.author.uri).length ? data.author.uri : 'https://saucal.com/';
let pluginAuthorEmail = String(data.author.email).length ? data.author.email : 'info@saucal.com';
let pluginNamePackage = packagify( pluginSlug );
let pluginNameShortPackage = String(data.shortpkg).length ? data.shortpkg : shortify( pluginName );
let pluginNameContantsPrefix = pluginNameShortPackage.toUpperCase();
let pluginNameSingleton = String(data.singleton).length ? data.singleton : pluginNameShortPackage;
let pluginNameInstance = pluginSlug.replace(/-/gi, '_');
let pluginAuthorFull = pluginAuthor +' <'+ pluginAuthorEmail + '>';

let sourcePath = path.join( process.cwd(), 'source-' + (new Date()).getTime() );

let sourcePluginPath = path.join( sourcePath, pluginSlug );
var targetPluginPath = path.join( process.cwd(), path.basename( sourcePluginPath ) );
try {
	statSync( targetPluginPath );
	console.warn( "Plugin already exists." );
	process.exit( 1 );
} catch( e ) {
	// all good
}

rimraf.sync( sourcePath );

downloadGH( "saucal/WordPress-Plugin-Boilerplate#" + data.branch, sourcePath, function(err) {
	if ( err ) {
		throw err;
	}

	renameSync( path.join( sourcePath, 'plugin-name' ), sourcePluginPath );

	walkDirectory( sourcePluginPath, function( f ) {
		let pname = path.dirname( f );
		let fname = path.basename( f );
		let newName = fname
			.replace(/plugin-name/gi, pluginSlug)
			.replace(/pname/gi, pluginNameShortPackage.toLowerCase().replace(/_/gi, '-'));
		newName = path.join( pname, newName );
		if( newName === f ) {
			return f;
		}
		renameSync( f, newName );
		return newName;
	} );

	let replacements = [
		[ "http://example.com/plugin-name-uri/", pluginURI ],
		[ "WordPress Plugin Boilerplate", pluginName ],
		[ "Your Name or Your Company", pluginAuthor ],
		[ "Your Name <email@example.com>", pluginAuthorFull ],
		[ "Plugin_Name", pluginNamePackage ],
		[ "plugin-name", pluginSlug ],
		[ "plugin_name", pluginNameInstance ],
		[ "PNameSingleton", pluginNameSingleton ],
		[ "PName", pluginNameShortPackage ],
		[ "pname", pluginNameShortPackage.toLowerCase().replace(/_/gi, '-') ],
		[ "PNAME", pluginNameContantsPrefix ],
		[ "http://example.com/?", pluginAuthorURI ],
	];

	replacements.map( function( rule ) {
		replace( {
			regex: rule[0],
			replacement: rule[1],
			paths: [ sourcePluginPath ],
			recursive: true,
			silent: true,
		} );
	} );

	renameSync( sourcePluginPath, targetPluginPath );

	rimraf.sync( sourcePath );
} );
