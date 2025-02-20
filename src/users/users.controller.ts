import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationQueryDto } from 'src/posts/pagination/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guards/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/params/token-payload.params';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import { diskStorage } from 'multer';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  PaginatedBloggerCreatedPostResponseDto,
  PaginatedUserSavedPostResponseDto,
  UpdatedProfilePictureResponseDto,
  UserResponseDto,
  UserSavePostsResponseDto,
  UserUnsavePostsResponseDto,
} from './dto/user-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthTokenGuard)
  @Get('/saved-posts')
  @ApiOperation({ summary: 'Get saved posts' })
  @ApiResponse({
    status: 200,
    description: 'Saved posts found',
    type: PaginatedUserSavedPostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Saved posts not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  getSavedPosts(
    @Query() query: PaginationQueryDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.getSavedPosts(tokenPayload.sub, query);
  }

  @UseGuards(AuthTokenGuard)
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Users found',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Users not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  findAll(@TokenPayloadParam() tokenPayload: TokenPayloadDto) {
    return this.usersService.findAll(tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  findOne(
    @Param('id') id: string,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.findOne(+id, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Post('/saved-posts/:postId')
  @ApiOperation({ summary: 'Save a post' })
  @ApiResponse({
    status: 201,
    description: 'Post saved successfully',
    type: UserSavePostsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 409, description: 'Post already saved' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  savePost(
    @Param('postId', ParseIntPipe) postId: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.savePost(tokenPayload.sub, postId);
  }

  @UseGuards(AuthTokenGuard)
  @Delete('/saved-posts/:postId')
  @ApiOperation({ summary: 'Unsave a post' })
  @ApiResponse({
    status: 200,
    description: 'Post removed from saved posts',
    type: UserUnsavePostsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  unsavePost(
    @Param('postId', ParseIntPipe) postId: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.unsavePost(tokenPayload.sub, postId);
  }

  @UseGuards(AuthTokenGuard)
  @Post('/upload-profile')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiResponse({
    status: 200,
    description: 'Profile image uploaded successfully',
    type: UpdatedProfilePictureResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profiles/temp', // Temporary storage
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + path.extname(file.originalname));
        },
      }),
    }),
  )
  async uploadProfileImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            message: 'File size must be less than 5MB',
          }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.updateProfileImage(tokenPayload.sub, file);
  }

  @Get('profile/:filename')
  @ApiOperation({ summary: 'Get profile image' })
  @ApiResponse({ status: 200, description: 'Profile image found' })
  @ApiResponse({ status: 404, description: 'Profile image not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  serveCoverImage(@Param('filename') filename: string, @Res() res: Response) {
    const imagePath = path.join(process.cwd(), 'uploads/profiles', filename);

    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException('Image not found');
    }

    res.sendFile(imagePath);
  }

  @UseGuards(AuthTokenGuard)
  @Get('blogger/posts')
  @ApiOperation({ summary: 'Get blogger posts' })
  @ApiResponse({
    status: 200,
    description: 'Blogger posts found',
    type: PaginatedBloggerCreatedPostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Blogger posts not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  getBloggerPosts(
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.usersService.getBloggerPosts(tokenPayload.sub, query);
  }
}
