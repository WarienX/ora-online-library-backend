import { decode, sign, verify } from 'jsonwebtoken'

export const generateToken = async ( payload: any, expiry = '30d' ) => {

    const secret = process.env[ 'JWT_SECRET' ]
    const accessToken = sign( payload, secret, {
        expiresIn: expiry
    } )
    return {
        accessToken
    }
}

export const verifyToken = async ( token: string ): Promise<any> => {
    const secret = process.env[ 'JWT_SECRET' ]
    verify( token, secret, {
        ignoreExpiration: false,
    } )
    const decoded = decode( token, { complete: true, json: true } )
    return decoded
}