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

const mapAsync = async function( data, cb ) {
	for( let i in data ) {
		data[i] = await cb( data[i], i, data );
	}
	return data;
}

const walkDirectory = async (dir, cb) => {
	cb = cb || ( (f) => f );
	let data = readdirSync(dir)
		.map( ( f ) => path.join( dir, f ) );
	
	data = await mapAsync( data, async ( f ) => statSync( f ).isDirectory() ? await walkDirectory( f ) : f );

	data = data.flat();

	data = await mapAsync( data, cb );
	return data;
}

module.exports = {
	fromProjectRoot,
	fromConfigRoot,
	fromScriptsRoot,
	getScripts,
	hasProjectFile,
	hasScriptFile,
	walkDirectory,
};
