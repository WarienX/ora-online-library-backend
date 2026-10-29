import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { BookEntity } from "./books.entity";
import { StudentEntity } from "./students.entity";
import { UserEntity } from "./users.entity";

@Entity( { name: 'book_status' } )
export class BookStatusEntity extends BaseEntity {
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
    student_id: number;

    @ManyToOne(() => StudentEntity)
    @JoinColumn({ name: 'student_id', referencedColumnName: 'id' })
    student: StudentEntity;

    @Column({
        nullable: false,
        type: 'integer',
    })
    last_updated_by: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'last_updated_by', referencedColumnName: 'id' })
    user: UserEntity;

    @Column( {
        type: 'enum',
        enum: ['available', 'borrowed', 'reserved', 'unavailable'],
        default: 'available'
    })
    status: string;

    @Column({ 
        type: 'timestamp', 
        nullable: true 
    })
    borrowed_on: string;

    @Column({ 
        type: 'timestamp', 
        nullable: true 
    })
    returned_on: string;

    @Column({ 
        type: 'timestamp', 
        nullable: true
    })
    return_by_date: string;

    @Column({ 
        type: 'timestamp', 
        nullable: true 
    })
    reserved_on: string;
}