import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Like, Repository } from 'typeorm';
import { Post } from 'src/posts/entities/post.entity';
import { PaginationQueryDto } from 'src/posts/pagination/dto/pagination.dto';
import { PaginatedResult } from 'src/posts/pagination/pagination.interface';
import { HashingService } from 'src/auth/hashing/hashing.service';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly hashingService: HashingService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const passwordHash = await this.hashingService.hash(
        createUserDto.password,
      );
      const userData = {
        name: createUserDto.name,
        email: createUserDto.email,
        profilePicture: createUserDto.profilePicture,
        passwordHash,
        role: createUserDto.role,
      };

      const newUser = this.userRepository.create(userData);

      return await this.userRepository.save(newUser);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findAll(tokenPayload: TokenPayloadDto) {
    if (tokenPayload.role !== 'blogger') {
      throw new UnauthorizedException(
        'You are not allowed to access this route',
      );
    }
    try {
      const users = await this.userRepository.find({
        select: ['id', 'name', 'email', 'profilePicture', 'role'],
      });

      if (users.length === 0) {
        throw new NotFoundException('No users found');
      }

      return users;
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number, tokenPayload: TokenPayloadDto) {
    if (tokenPayload.role !== 'blogger' && tokenPayload.sub !== id) {
      throw new UnauthorizedException(
        'You are not allowed to access this route',
      );
    }
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'name', 'email', 'profilePicture', 'role'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async savePost(userId: number, postId: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['savedPosts'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const post = await this.postRepository.findOne({
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const isPostSaved = user.savedPosts.some(
        (savedPost) => savedPost.id === postId,
      );
      if (isPostSaved) {
        throw new ConflictException('Post is already saved');
      }

      user.savedPosts.push(post);
      await this.userRepository.save(user);

      return { message: 'Post saved successfully' };
    } catch (error) {
      throw error;
    }
  }

  async unsavePost(userId: number, postId: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['savedPosts'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const savedPostIndex = user.savedPosts.findIndex(
        (post) => post.id === postId,
      );
      if (savedPostIndex === -1) {
        throw new NotFoundException('Post is not in saved posts');
      }

      user.savedPosts.splice(savedPostIndex, 1);
      await this.userRepository.save(user);

      return { message: 'Post removed from saved posts' };
    } catch (error) {
      throw error;
    }
  }

  async getSavedPosts(
    userId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10, category, search } = query;
    const skip = (page - 1) * limit;

    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const whereClause: any = {
        savedByUsers: { id: userId },
      };

      if (category) {
        whereClause.category = category;
      }
      if (search) {
        whereClause.title = Like(`%${search}%`);
      }

      const [posts, total] = await this.postRepository.findAndCount({
        where: whereClause,
        relations: ['author'],
        select: {
          author: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        order: {
          createdAt: 'DESC',
        },
        skip,
        take: limit,
      });

      if (!posts.length) {
        throw new NotFoundException('No saved posts found');
      }

      const lastPage = Math.ceil(total / limit);

      return {
        data: posts,
        meta: {
          total,
          page,
          lastPage,
          limit,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
