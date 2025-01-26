import { ApiProperty } from '@nestjs/swagger';

export class CreatePostAuthorResponseDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 'ichigo' })
  name: string;

  @ApiProperty({ example: 'fakefot.com' })
  profilePicture: string;
}

export class CreatePostResponseDto {
  @ApiProperty({ example: 13 })
  id: number;

  @ApiProperty({
    example: 'The Rise of Remote Work: A Permanent Transformation',
  })
  title: string;

  @ApiProperty({ example: 'What began as a necessity during lockdowns...' })
  content: string;

  @ApiProperty({ example: 'https://example.com/images/remote-work.jpg' })
  coverImage: string;

  @ApiProperty({ example: 'technology' })
  category: string;

  @ApiProperty({ example: '2025-01-26T13:31:22.771Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-26T13:31:22.771Z' })
  updatedAt: string;

  @ApiProperty({ type: CreatePostAuthorResponseDto })
  author: CreatePostAuthorResponseDto;
}

export class UpdatedPostResponseDto extends CreatePostResponseDto {}

export class GetPostByIdResponseDto extends CreatePostResponseDto {}

export class PaginatedGetPostsResponseDto {
  @ApiProperty({
    type: CreatePostResponseDto,
    isArray: true,
  })
  data: CreatePostResponseDto[];

  @ApiProperty({
    example: {
      total: 8,
      page: 3,
      lastPage: 4,
      limit: 2,
    },
  })
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export class UpdatedPostCoverResponseDto {
  @ApiProperty({
    example: 13,
  })
  userId: number;

  @ApiProperty({ example: 'Cover image updated successfully' })
  message: string;

  @ApiProperty({ example: 'post-cover-1737898895956-144566741.jpg' })
  coverImage: string;
}

export class DeletedPostResponseDto {
  @ApiProperty({ example: 13 })
  removedPostId: number;

  @ApiProperty({ example: 'Post deleted successfully' })
  message: string;
}
