import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity( { name: 'grades' } )
export class GradeEntity extends BaseEntity {
    @Column({
        nullable: false,
        type: 'varchar',
    })
    name: string;

    @Column({
        nullable: false,
        unique: true,
        type: 'integer',
    })
    grade_number: number;

    @Column({
        type: 'boolean',
        default: true
    })
    is_active: boolean;
}