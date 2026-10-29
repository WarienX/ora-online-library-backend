import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity( { name: 'users' } )
export class UserEntity extends BaseEntity {
    @Column({
        nullable: false,
        type: 'varchar',
    })
    full_name: string;

    @Column({
        nullable: false,
        type: 'varchar',
    })
    email_id: string;

    @Column({
        nullable: true,
        type: 'bigint'
    })
    mobile_no: number;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    dob: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    gender: string;

    @Column({
        nullable: true,
        type: 'bigint'
    })
    age: number;

    @Column( {
        type: 'enum',
        enum: ['admin', 'librarian', 'teacher', 'student'],
        default: 'student'
    })
    role: string;

    @Column({
        nullable: false,
        type: 'text',
    })
    temp_password: string; // disable later

    @Column({
        nullable: false,
        type: 'text',
    })
    master_password: string;

    @Column({ 
        nullable: false,
        type: 'boolean',
        default: true
    })
    is_active: boolean;

    @Column({
        nullable: false,
        type: 'varchar',
    })
    google_id: string;
}