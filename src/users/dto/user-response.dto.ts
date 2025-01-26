import { ApiProperty, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UserResponseDto extends OmitType(CreateUserDto, [
  'password',
] as const) {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  id: number;
}

export class UserSavePostsResponseDto {
  @ApiProperty({
    description: 'Post Id',
    example: 1,
  })
  postId: number;

  @ApiProperty({
    description: 'Message',
    example: 'Post saved successfully',
  })
  message: string;
}

export class UserUnsavePostsResponseDto {
  @ApiProperty({
    description: 'Message',
    example: 'Post removed from saved posts',
  })
  message: string;
}

export class AuthorResponseDto {
  @ApiProperty({ example: 8 })
  id: number;

  @ApiProperty({ example: 'yoruichi' })
  name: string;

  @ApiProperty({ example: 'user-profile-1737894734379-329321805.jpg' })
  profilePicture: string;
}

export class PostResponseDto {
  @ApiProperty({ example: 9 })
  id: number;

  @ApiProperty({ example: 'Cultural Shifts in the Post-Pandemic World' })
  title: string;

  @ApiProperty({
    example: 'The global pandemic has left an indelible mark...',
  })
  content: string;

  @ApiProperty({ example: 'https://example.com/images/cultural-shifts.jpg' })
  coverImage: string;

  @ApiProperty({ example: 'culture' })
  category: string;

  @ApiProperty({ example: '2025-01-24T12:55:18.552Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-24T12:55:18.552Z' })
  updatedAt: string;

  @ApiProperty({ type: AuthorResponseDto })
  author: AuthorResponseDto;
}

export class PaginatedUserSavedPostResponseDto {
  @ApiProperty({
    type: PostResponseDto,
    isArray: true,
  })
  data: PostResponseDto[];

  @ApiProperty({
    example: {
      total: 1,
      page: 1,
      lastPage: 1,
      limit: 10,
    },
  })
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export class UpdatedProfilePictureResponseDto {
  @ApiProperty({
    example: 13,
  })
  userId: number;

  @ApiProperty({ example: 'user-profile-1737894734379-329321805.jpg' })
  profilePicture: string;

  @ApiProperty({ example: 'Profile picture updated successfully' })
  message: string;
}

export class PaginatedBloggerCreatedPostResponseDto extends PaginatedUserSavedPostResponseDto {
  @ApiProperty({
    type: PostResponseDto,
    isArray: true,
  })
  data: PostResponseDto[];
}
