import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

export const loadConfig = async () => {
    const envFilename = '.env'
    const envPath = [
        path.resolve( path.dirname( require?.main?.filename || process.cwd() ), '..', envFilename ),
        path.resolve( process.cwd(), envFilename )
    ].find( ( envPath ) => fs.existsSync( envPath ) )

    if ( envPath ) {
        dotenv.config( { path: envPath } )
        console.log( `✅ ${envFilename} loaded.` )
    } else {
        console.log( `⚠️  ${envFilename} not found.` )
    }
}
loadConfig()