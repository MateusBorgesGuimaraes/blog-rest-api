import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Like, Repository } from 'typeorm';
import { PaginationQueryDto } from './pagination/dto/pagination.dto';
import { PaginatedResult } from './pagination/pagination.interface';
import { User } from 'src/users/entities/user.entity';

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

    // Build where clause
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
      // First verify if user exists
      const userExists = await this.userRepository.findOneBy({ id: userId });
      if (!userExists) {
        throw new NotFoundException('User not found');
      }

      // Get posts with total count
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

      // Calculate last page
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

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
