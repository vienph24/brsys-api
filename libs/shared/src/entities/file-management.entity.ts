import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '@app/shared/entities/base.entity';

@Entity({
    name: 'file_managements',
})
export class FileManagementEntity extends BaseEntity {
    @PrimaryColumn()
    id: string;

    @Column()
    customerId: string;

    @Column()
    fileName: string;

    @Column()
    sha1: string;

    @Column()
    status: string;

    @Column({
        nullable: true,
    })
    reason: string;
}
