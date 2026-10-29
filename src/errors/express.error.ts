import { NextFunction, Request, Response } from 'express'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'

export class ExpressException extends Error {
    constructor( message: string, public status: StatusCodes ) {
        super( message )
    }
}

export const errorHandler = ( error: Error, req: Request, res: Response, next: NextFunction ) => {
    if ( error instanceof ExpressException ) {
        return res.status( error.status ).json( { message: error.message } )
    }
    
    return res.status( StatusCodes.INTERNAL_SERVER_ERROR ).json( { message: ReasonPhrases.INTERNAL_SERVER_ERROR } )
}