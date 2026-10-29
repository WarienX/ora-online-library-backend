import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { BookEntity } from "./books.entity";
import { GradeEntity } from "./grade.entity";

@Entity( { name: 'book_grades' } )
export class BookGradeEntity extends BaseEntity {
    @Column({
        nullable: false,
        type: 'integer',
    })
    book_id: number;

    @ManyToOne(() => BookEntity)
    @JoinColumn({ name: 'book_id', referencedColumnName: 'id' })
    book: BookEntity;

    @Column({
        nullable: false,
        type: 'integer',
    })
    grade_id: number;

    @ManyToOne(() => GradeEntity)
    @JoinColumn({ name: 'grade_id', referencedColumnName: 'id' })
    grade: GradeEntity;
}