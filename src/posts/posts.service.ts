import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Like, Repository } from 'typeorm';
import { PaginationQueryDto } from './pagination/dto/pagination.dto';
import { PaginatedResult } from './pagination/pagination.interface';
import { User } from 'src/users/entities/user.entity';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async create(createPostDto: CreatePostDto, authorId: number) {
    try {
      // Check if author exists
      const author = await this.userRepository.findOneBy({ id: authorId });

      if (!author) {
        throw new NotFoundException('Author not found');
      }

      // Create and save the post
      const post = this.postRepository.create({
        ...createPostDto,
        author: { id: authorId },
      });

      const savedPost = await this.postRepository.save(post);

      // Return the saved post with author information
      return this.postRepository.findOne({
        where: { id: savedPost.id },
        relations: ['author'],
        select: {
          author: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10, category, search } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
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
      throw new NotFoundException('Posts not found');
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
  }

  async findOne(id: number) {
    try {
      const post = await this.postRepository.findOne({
        where: { id },
        relations: ['author'],
        select: {
          author: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      return post;
    } catch (error) {
      throw error;
    }
  }

  async findUserPosts(
    userId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10, category, search } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      author: { id: userId },
    };

    if (category) {
      whereClause.category = category;
    }
    if (search) {
      whereClause.title = Like(`%${search}%`);
    }

    try {
      const userExists = await this.userRepository.findOneBy({ id: userId });
      if (!userExists) {
        throw new NotFoundException('User not found');
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
        throw new NotFoundException('No posts found for this user');
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

  async update(
    id: number,
    updatePostDto: UpdatePostDto,
    tokenPayload: TokenPayloadDto,
  ) {
    if (tokenPayload.role !== 'blogger') {
      throw new UnauthorizedException(
        'You are not allowed to update this post',
      );
    }

    try {
      const post = await this.postRepository.findOneBy({ id });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (tokenPayload.sub !== post.author.id) {
        throw new UnauthorizedException(
          'You are not allowed to update this post',
        );
      }

      const updatedPost = {
        ...post,
        ...updatePostDto,
      };

      return this.postRepository.save(updatedPost);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number, tokenPayload: TokenPayloadDto) {
    if (tokenPayload.role !== 'blogger') {
      throw new UnauthorizedException(
        'You are not allowed to delete this post',
      );
    }

    try {
      const post = await this.postRepository.findOneBy({ id });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (tokenPayload.sub !== post.author.id) {
        throw new UnauthorizedException(
          'You are not allowed to delete this post',
        );
      }

      return this.postRepository.remove(post);
    } catch (error) {
      throw error;
    }
  }

  async updateCoverImage(
    postId: number,
    coverImageFilename: string,
    tokenPayload: TokenPayloadDto,
  ) {
    console.log('tokenPayload:', tokenPayload);
    if (tokenPayload.role !== 'blogger') {
      throw new UnauthorizedException(
        'You are not allowed to update this post',
      );
    }

    try {
      const post = await this.postRepository.findOne({
        where: { id: postId },
        relations: ['author'],
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (tokenPayload.sub !== post.author.id) {
        throw new UnauthorizedException(
          'You are not allowed to update this post',
        );
      }

      if (post.coverImage) {
        const oldImagePath = path.join('./uploads/posts', post.coverImage);

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      post.coverImage = coverImageFilename;

      return this.postRepository.save(post);
    } catch (error) {
      const filePath = path.join('./uploads/posts', coverImageFilename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      throw error;
    }
  }
}
