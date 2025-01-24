import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from 'src/posts/pagination/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guards/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/params/token-payload.params';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import { diskStorage } from 'multer';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthTokenGuard)
  @Get()
  findAll(@TokenPayloadParam() tokenPayload: TokenPayloadDto) {
    return this.usersService.findAll(tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.findOne(+id, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Post('/saved-posts/:postId')
  savePost(
    @Param('postId', ParseIntPipe) postId: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.savePost(tokenPayload.sub, postId);
  }

  @UseGuards(AuthTokenGuard)
  @Delete('/saved-posts/:postId')
  unsavePost(
    @Param('postId', ParseIntPipe) postId: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.unsavePost(tokenPayload.sub, postId);
  }

  @UseGuards(AuthTokenGuard)
  @Get('/saved-posts')
  getSavedPosts(
    @Query() query: PaginationQueryDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.getSavedPosts(tokenPayload.sub, query);
  }

  @Post('upload-profile')
  @UseGuards(AuthTokenGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          const filename = `user-profile-${uniqueSuffix}${ext}`;
          cb(null, filename);
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
    const uploadDir = './uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return this.usersService.updateProfileImage(
      tokenPayload.sub,
      file.filename,
      tokenPayload,
    );
  }

  @Get('profile/:filename')
  serveCoverImage(@Param('filename') filename: string, @Res() res: Response) {
    const imagePath = path.join(process.cwd(), 'uploads/profiles', filename);

    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException('Image not found');
    }

    res.sendFile(imagePath);
  }

  @UseGuards(AuthTokenGuard)
  @Get('blogger/posts')
  getBloggerPosts(
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.usersService.getBloggerPosts(tokenPayload.sub, query);
  }
}
