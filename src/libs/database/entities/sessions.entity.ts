import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { UserEntity } from "./users.entity";

@Entity({ name: 'user_sessions' })
export class user_sessions extends BaseEntity {
    @Column({
        nullable: false,
        type: 'integer',
    })
    user_id: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
    user: UserEntity;

    @Column({
        nullable: false,
        type: 'boolean',
        default: false
    })
    is_logged_out: boolean;

    @Column({ 
        type: 'timestamp', 
        nullable: true 
    })
    logout_time: string;
    
    @Column({ 
        type: 'varchar', 
        nullable: true 
    })
    deviceId: string;
}