import { Container } from 'typedi'
import { EntitySchema } from 'typeorm'

export const getTypeOrmRepository = ( entity: new () => any ) => {
    return Container.get( getRepositoryToken( entity ) )
}

export const getRepositoryToken = ( entity: new () => any ): string => {
    if ( entity instanceof EntitySchema ) {
        return `${
            entity.options.target
                ? entity.options.target.name
                : entity.options.name
        }Repository`
    }
    return `${entity.name}Repository`
}