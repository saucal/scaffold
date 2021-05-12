/**
 * External dependencies
 */
const { existsSync, readdirSync, statSync } = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { getPackagePath } = require( './package' );

const fromProjectRoot = ( fileName ) =>
	path.join( path.dirname( getPackagePath() ), fileName );

const hasProjectFile = ( fileName ) =>
	existsSync( fromProjectRoot( fileName ) );

const fromConfigRoot = ( fileName ) =>
	path.join( path.dirname( __dirname ), 'config', fileName );

const fromScriptsRoot = ( scriptName ) =>
	path.join( path.dirname( __dirname ), 'scripts', `${ scriptName }.js` );

const hasScriptFile = ( scriptName ) =>
	existsSync( fromScriptsRoot( scriptName ) );

const getScripts = () =>
	readdirSync( path.join( path.dirname( __dirname ), 'scripts' ) )
		.filter( ( f ) => path.extname( f ) === '.js' )
		.map( ( f ) => path.basename( f, '.js' ) );

const walkDirectory = (dir, cb) =>
	readdirSync(dir)
		.map( ( f ) => path.join( dir, f ) )
		.map( ( f ) => statSync( f ).isDirectory() ? walkDirectory( f ) : f )
		.flat()
		.map( cb || ( (f) => f ) );

module.exports = {
	fromProjectRoot,
	fromConfigRoot,
	fromScriptsRoot,
	getScripts,
	hasProjectFile,
	hasScriptFile,
	walkDirectory,
};
