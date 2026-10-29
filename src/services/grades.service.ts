import { Not, Repository } from "typeorm";
import { GradeEntity } from "../libs";
import { getTypeOrmRepository } from "../utils";
import { ExpressException } from "../errors";
import { StatusCodes } from "http-status-codes";

export const addGrades = async (name: string, gradeNumber: number) => {
    const gradeRepo = getTypeOrmRepository(GradeEntity) as Repository<GradeEntity>;

    const checkGrade = await gradeRepo.findOne({
        where: {
            grade_number: gradeNumber,
            is_active: true
        }
    })

    if (checkGrade) {
        throw new ExpressException("Grade Number already exists", StatusCodes.CONFLICT);
    }

    const newGrade = gradeRepo.create({
        name: name,
        grade_number: gradeNumber
    });
    const newGradeResp = await gradeRepo.save(newGrade);
    return newGradeResp;
}

export const editGrades = async (gradeId: number, name: string, gradeNumber: number) => {
    const gradeRepo = getTypeOrmRepository(GradeEntity) as Repository<GradeEntity>;

    const checkGrade = await gradeRepo.findOne({
        where: {
            id: gradeId,
            is_active: true
        }
    })
    if (!checkGrade) {
        throw new ExpressException("Grade does not exists", StatusCodes.NOT_FOUND);
    } else {
        const checkDuplicateGrade = await gradeRepo.findOne({
            where: {
                name: name,
                grade_number: Not(gradeNumber),
                is_active: true
            }
        })
        if (checkDuplicateGrade) {
            throw new ExpressException("Another Grade with same name exists", StatusCodes.CONFLICT);
        }

        checkGrade.name = name;
        const updatedGrade = await gradeRepo.save(checkGrade);

        return updatedGrade;
    }
}

export const fetchGrades = async () => {
    const gradeRepo = getTypeOrmRepository(GradeEntity) as Repository<GradeEntity>;
    const gradeList = await gradeRepo.find({
        where: {
            is_active: true
        },
        order: {
            grade_number: "ASC"
        }
    });

    return gradeList;
}

export const fetchGradeById = async (gradeId: number) => {
    const gradeRepo = getTypeOrmRepository(GradeEntity) as Repository<GradeEntity>;
    const gradeData = await gradeRepo.findOne({
        where: {
            id: gradeId,
            is_active: true
        }
    });
    return gradeData;
}