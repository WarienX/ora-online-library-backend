import { Container } from 'typedi'
import { DataSource } from 'typeorm'
import { entities } from '../libs'
import { getRepositoryToken } from '../utils'

export const initializeDatabase = async () => {
    const env = process.env
    const dataSource = new DataSource( {
        type: 'postgres',
        host: env[ 'DATABASE_HOST' ],
        port: parseInt( env[ 'DATABASE_PORT' ] ),
        username: env[ 'DATABASE_USER' ],
        password: env[ 'DATABASE_PASSWORD' ],
        database: env[ 'DATABASE_NAME' ],
        synchronize: true,
        logging: false,
        entities: [
            ...Object.values( entities ),
        ],
    } )

    await dataSource.initialize()

    Object.values( entities ).forEach( ( entity ) => {
        Container.set( getRepositoryToken( entity ), dataSource.getRepository( entity ) )
    } )
}