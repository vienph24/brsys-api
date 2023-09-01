import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@app/shared/entities/base.entity';

@Entity({
    name: 'transactions',
})
export class TransactionEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    customer: string;

    @Column()
    fileName: string;

    /**
     * The data from customer's uploaded file
     */
    @Column()
    date: string;

    @Column()
    content: string;

    @Column({
        type: 'float',
    })
    amount: number;

    @Column()
    type: string;
}
