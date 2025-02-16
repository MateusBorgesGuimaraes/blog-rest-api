import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PostCategory {
  LIVROS = 'livros',
  FICCAO = 'ficcao',
  HISTORIA = 'história',
  TECNOLOGIA = 'tecnologia',
  CIENCIA = 'ciencia',
  POLITICA = 'politica',
}

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: '' })
  coverImage: string;

  @ManyToOne(() => User, (user) => user.createdPosts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'enum', enum: PostCategory })
  category: string;

  @ManyToMany(() => User, (user) => user.savedPosts)
  @JoinTable({
    name: 'user_saved_posts',
    joinColumn: {
      name: 'postId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  savedByUsers: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
