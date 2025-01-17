import {
  IsString,
  IsEnum,
  IsOptional,
  Length,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { PostCategory } from '../entities/post.entity';

export class CreatePostDto {
  @IsString()
  @Length(3, 255, { message: 'Title must be between 3 and 255 characters' })
  title: string;

  @IsString()
  @MaxLength(16777215, { message: 'Content exceeds maximum length' })
  @Length(10, 16777215, {
    message: 'Content must be at least 10 characters long',
  })
  content: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Cover image must be a valid URL' })
  coverImage?: string;

  @IsEnum(PostCategory, { message: 'Invalid category' })
  category: PostCategory;
}
