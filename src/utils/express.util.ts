import { NextFunction, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { IRequest, UserRole } from '../libs'
import { ExpressException } from '../errors'

export const requestHandler = (
    fn: ( req: IRequest, res: Response, next?: NextFunction ) => Promise<any> | any,
    roles?: UserRole[]
) => {
    return async ( req: IRequest, res: Response, next: NextFunction ) => {
        try {
            if ( roles && ( roles.length > 0 ) && !roles.includes( req.payload?.role ) ) 
                throw new ExpressException( 'Unauthorized', StatusCodes.UNAUTHORIZED )
            await fn( req, res, next )
        } catch ( error ) {
            const env = process.env[ 'NODE_ENV' ] || 'development'
            if ( env === 'development' ) console.error( error )
            next( error )
        }
    }
}