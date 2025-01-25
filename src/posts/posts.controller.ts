import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseFilePipe,
  UploadedFile,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseInterceptors,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationQueryDto } from './pagination/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guards/auth-token.guard';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import { TokenPayloadParam } from 'src/auth/params/token-payload.params';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthTokenGuard)
  @Post('create')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: 201,
    description: 'The post has been successfully created.',
  })
  @ApiResponse({
    status: 401,
    description: 'You are not allowed to create a post.',
  })
  @ApiResponse({
    status: 404,
    description: 'Author not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.',
  })
  create(
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(createPostDto, tokenPayload);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of posts.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.',
  })
  @ApiResponse({
    status: 404,
    description: 'Posts not found.',
  })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.postsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by id' })
  @ApiResponse({
    status: 200,
    description: 'Returns a post.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found.',
  })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @UseGuards(AuthTokenGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({
    status: 200,
    description: 'The post has been successfully updated.',
  })
  @ApiResponse({
    status: 401,
    description: 'You are not allowed to update this post.',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found.',
  })
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.postsService.update(+id, updatePostDto, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({
    status: 200,
    description: 'The post has been successfully deleted.',
  })
  @ApiResponse({
    status: 401,
    description: 'You are not allowed to delete this post.',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found.',
  })
  remove(
    @Param('id') id: string,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.postsService.remove(+id, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Get('user')
  @ApiOperation({ summary: 'Get all saved posts of a user' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of posts.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.',
  })
  @ApiResponse({
    status: 404,
    description: 'Posts not found.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  getUserPosts(
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.postsService.findUserPosts(tokenPayload.sub, query);
  }

  @UseGuards(AuthTokenGuard)
  @Post('upload-cover/:postId')
  @ApiOperation({ summary: 'Upload a cover image for a post' })
  @ApiResponse({
    status: 200,
    description: 'The cover image has been successfully uploaded.',
  })
  @ApiResponse({
    status: 401,
    description: 'You are not allowed to upload a cover image for this post.',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/posts',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          const filename = `post-cover-${uniqueSuffix}${ext}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async uploadCoverImage(
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
    @Param('postId') postId: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    const uploadDir = './uploads/posts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return this.postsService.updateCoverImage(
      postId,
      file.filename,
      tokenPayload,
    );
  }

  @Get('cover/:filename')
  @ApiOperation({ summary: 'Serve a cover image for a post' })
  @ApiResponse({
    status: 200,
    description: 'The cover image has been successfully served.',
  })
  @ApiResponse({
    status: 404,
    description: 'Image not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.',
  })
  serveCoverImage(@Param('filename') filename: string, @Res() res: Response) {
    const imagePath = path.join(process.cwd(), 'uploads/posts', filename);

    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException('Image not found');
    }

    res.sendFile(imagePath);
  }
}
