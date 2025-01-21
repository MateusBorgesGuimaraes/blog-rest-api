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
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationQueryDto } from './pagination/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guards/auth-token.guard';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import { TokenPayloadParam } from 'src/auth/params/token-payload.params';

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
}
