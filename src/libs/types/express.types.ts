import { Request } from 'express'
import { UserEntity } from "../database"
import { UserRole } from "../enums"

export type IRequest = {
    payload?: {
        id: string,
        role: UserRole
        [key: string]: any
    },
    authenticatedUser?: Partial<UserEntity>,
    deviceId: string
} & Request