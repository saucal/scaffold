/**
 * External dependencies
 */
const path = require( 'path' );
const { existsSync, renameSync } = require( 'fs' );
const downloadGH = require( 'download-git-repo' );
const rimraf = require( 'rimraf' );
const replace = require( 'replace' );
const slugify = require( 'slugify' );
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
	package: getArgFromCLI( '--package' ) || '',
	shortpkg: getArgFromCLI( '--short' ) || '',
	singleton: getArgFromCLI( '--singleton' ) || '',
	author: {
		name: 'SAU/CAL',
		uri: 'https://saucal.com/',
		email: 'info@saucal.com',
	}
};

const capitalize = function( name ) {
	var newName = "";
	pieces = name.split(' ');
	pieces.forEach(function(word){
		newName += word.charAt(0).toUpperCase() + word.slice(1);
	});
	return newName.trim();
}

const packagify = function(name){
	return capitalize(name.replace(/[^a-z0-9-_ ]/gi, '').replace(/[-_]/gi, ' '));
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

let pluginName = String(data.name).length ? data.name : 'Amazing Plugin';
let pluginSlug = String(data.slug).length ? slugify( data.slug ).toLowerCase() : slugify( pluginName ).toLowerCase();
let pluginURI = String(data.uri).length ? data.uri : 'https://saucal.com/' ;
let pluginAuthor = String(data.author.name).length ? data.author.name : 'SAU/CAL' ;
let pluginAuthorURI = String(data.author.uri).length ? data.author.uri : 'https://saucal.com/';
let pluginAuthorEmail = String(data.author.email).length ? data.author.email : 'info@saucal.com';
let pluginAuthorSlug = slugify( pluginAuthor ).toLowerCase()
let pluginNamePackage = String(data.package).length ? data.package : packagify( pluginName );
let pluginNameShortPackage = String(data.shortpkg).length ? data.shortpkg : shortify( pluginName );
let pluginNameContantsPrefix = pluginNameShortPackage.toUpperCase();
let pluginNameSingleton = String(data.singleton).length ? data.singleton : pluginNameShortPackage;
let pluginNameInstance = pluginSlug.replace(/-/gi, '_');
let pluginAuthorFull = pluginAuthor +' <'+ pluginAuthorEmail + '>';

let sourcePath = path.join( process.cwd(), 'source-' + (new Date()).getTime() );

let sourcePluginPath = path.join( sourcePath, pluginSlug );

let paths = [
	'wp-content/plugins',
	'plugins',
	'.'
];

let basePath;
for( var i in paths ) {
	let thisPath = path.resolve( path.join( process.cwd(), paths[i] ) );
	if ( existsSync( thisPath ) ) {
		basePath = thisPath;
		break;
	}
}

var targetPluginPath = path.join( basePath, path.basename( sourcePluginPath ) );

(async function(){
	if ( existsSync( targetPluginPath ) ) {
		let relative = path.relative( process.cwd(), targetPluginPath );
		let response;
		try {
			response = await prompt({
				type: 'confirm',
				name: 'question',
				message: 'Folder ' + relative + ' exists. Replace?',
				initial: false,
			});
		} catch {
			return process.exit( 1 );
		}
		if ( ! response ) {
			return process.exit( 1 );
		} else {
			rimraf.sync( targetPluginPath );
		}
	}
	
	rimraf.sync( sourcePath );
	
	downloadGH( "saucal/WordPress-Plugin-Boilerplate#" + data.branch, sourcePath, async function(err) {
		if ( err ) {
			console.error( "Couldn't download from GitHub. Maybe the branch \"" + data.branch + "\" doesn't exist?" );
			process.exit( 1 );
		}
	
		renameSync( path.join( sourcePath, 'plugin-name' ), sourcePluginPath );
	
		await walkDirectory( sourcePluginPath, function( f ) {
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
			[ "author-slug", pluginAuthorSlug ],
			[ "Plugin_Name", pluginNamePackage ],
			[ "plugin-name", pluginSlug ],
			[ "plugin_name", pluginNameInstance ],
			[ "PNameSingleton", pluginNameSingleton ],
			[ "PName", pluginNameShortPackage ],
			[ "pname_", pluginNameShortPackage.toLowerCase() + '_' ],
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
})()
