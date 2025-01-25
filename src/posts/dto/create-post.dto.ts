import {
  IsString,
  IsEnum,
  IsOptional,
  Length,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { PostCategory } from '../entities/post.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'Title of the post',
    example: 'Cultural Shifts in the Post-Pandemic World',
  })
  @IsString()
  @Length(3, 255, { message: 'Title must be between 3 and 255 characters' })
  title: string;

  @ApiProperty({
    description: 'Content of the post',
    example: 'Long text with a maximum of 16777215 characters',
  })
  @IsString()
  @MaxLength(16777215, { message: 'Content exceeds maximum length' })
  @Length(10, 16777215, {
    message: 'Content must be at least 10 characters long',
  })
  content: string;

  @ApiProperty({
    description: 'Cover image URL of the post',
    example: 'https://example.com/images/cultural-shifts.jpg',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Cover image must be a valid URL' })
  coverImage?: string;

  @ApiProperty({
    description: 'Category of the post',
    example: 'culture',
  })
  @IsEnum(PostCategory, { message: 'Invalid category' })
  category: PostCategory;
}
