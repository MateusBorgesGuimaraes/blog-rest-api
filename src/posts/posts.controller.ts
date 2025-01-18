import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationQueryDto } from './pagination/dto/pagination.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('create/:authorId')
  create(
    @Param('authorId') authorId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(createPostDto, +authorId);
  }

  @Get('user/:userId')
  getUserPosts(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.postsService.findUserPosts(+userId, query);
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.postsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(+id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id);
  }
}
