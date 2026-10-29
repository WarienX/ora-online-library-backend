import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { GradeEntity } from "./grade.entity";
import { BookStatusEntity } from "./book_status.entity";
import { BookGradeEntity } from "./book_grades.entity";

@Entity( { name: 'books' } )
export class BookEntity extends BaseEntity {
    @Column({
        nullable: false,
        type: 'varchar',
    })
    name: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    series_name: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    author: string;

    @Column({
        nullable: false,
        type: 'varchar',
    })
    genre: string;

    @Column({
        nullable: false,
        type: 'varchar',
    })
    language: string;

    @Column({
        nullable: false,
        type: 'bigint',
    })
    count: number;

    @Column({
        nullable: true,
        type: 'integer',
    })
    grade_id: number;

    @ManyToOne(() => GradeEntity)
    @JoinColumn({ name: 'grade_id', referencedColumnName: 'id' })
    grade: GradeEntity;

    @Column( {
        type: 'enum',
        enum: ['available', 'borrowed', 'reserved', 'unavailable'],
        default: 'available'
    })
    status: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    position: string;

    // Relation
    @OneToMany(() => BookGradeEntity, (bookGrade) => bookGrade.book)
    bookGrades: BookGradeEntity;

    @OneToMany(() => BookStatusEntity, (bookStatus) => bookStatus.book)
    bookStatus: BookStatusEntity;
}