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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from 'src/posts/pagination/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guards/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/params/token-payload.params';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';

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
}
