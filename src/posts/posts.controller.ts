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

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthTokenGuard)
  @Post('create')
  create(
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(createPostDto, tokenPayload.sub);
  }

  @UseGuards(AuthTokenGuard)
  @Get('user')
  getUserPosts(
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.postsService.findUserPosts(tokenPayload.sub, query);
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.postsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @UseGuards(AuthTokenGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.postsService.update(+id, updatePostDto, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.postsService.remove(+id, tokenPayload);
  }

  @Post('upload-cover/:postId')
  @UseGuards(AuthTokenGuard)
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
            maxSize: 5 * 1024 * 1024, // 5MB
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
  serveCoverImage(@Param('filename') filename: string, @Res() res: Response) {
    const imagePath = path.join(process.cwd(), 'uploads/posts', filename);

    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException('Image not found');
    }

    res.sendFile(imagePath);
  }
}
