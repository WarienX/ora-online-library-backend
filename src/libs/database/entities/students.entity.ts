import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { UserEntity } from "./users.entity";
import { GradeEntity } from "./grade.entity";

@Entity( { name: 'students' } )
export class StudentEntity extends BaseEntity {
    @Column({
        nullable: false,
        type: 'integer',
    })
    user_id: number;

    @OneToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
    user: UserEntity;

    @Column({
        nullable: false,
        type: 'integer',
    })
    grade_id: number;

    @ManyToOne(() => GradeEntity)
    @JoinColumn({ name: 'grade_id', referencedColumnName: 'id' })
    grade: GradeEntity;

    @Column({ 
        type: 'varchar', 
        nullable: true 
    })
    fathers_email: string;

    @Column({ 
        type: 'varchar', 
        nullable: true 
    })
    mothers_email: string;

    @Column({
        nullable: true,
        type: 'bigint'
    })
    fathers_mobile_no: number;

    @Column({
        nullable: true,
        type: 'bigint'
    })
    mothers_mobile_no: number;

    @Column({ 
        nullable: false,
        type: 'boolean',
        default: true
    })
    is_active: boolean;

}