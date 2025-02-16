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

  private readonly UPLOAD_DIR = './uploads/posts';

  async create(createPostDto: CreatePostDto, tokenPayload: TokenPayloadDto) {
    if (!tokenPayload.sub || tokenPayload.role !== 'blogger') {
      throw new UnauthorizedException('You are not allowed to create a post');
    }
    try {
      const author = await this.userRepository.findOneBy({
        id: tokenPayload.sub,
      });

      if (!author) {
        throw new NotFoundException('Author not found');
      }

      const post = this.postRepository.create({
        ...createPostDto,
        author: { id: tokenPayload.sub },
      });

      const savedPost = await this.postRepository.save(post);

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
    const { page = 1, limit = 10, category, search, order = 'desc' } = query;
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
        createdAt: order,
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
        order,
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
      const post = await this.postRepository.findOne({
        where: { id },
        relations: ['author'],
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (tokenPayload.sub !== post.author.id) {
        throw new UnauthorizedException(
          'You are not allowed to delete this post',
        );
      }

      await this.postRepository.remove(post);

      return { removedPostId: id, message: 'Post deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  private generateUniqueFilename(originalFilename: string): string {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(originalFilename);
    return `post-cover-${uniqueSuffix}${ext}`;
  }

  private async deleteOldCoverImage(coverImage: string): Promise<void> {
    if (coverImage) {
      const oldImagePath = path.join(this.UPLOAD_DIR, coverImage);
      if (fs.existsSync(oldImagePath)) {
        await fs.promises.unlink(oldImagePath);
      }
    }
  }

  private async saveCoverImage(file: Express.Multer.File): Promise<string> {
    this.ensureUploadDirectory();
    const filename = this.generateUniqueFilename(file.originalname);
    const filepath = path.join(this.UPLOAD_DIR, filename);

    try {
      await fs.promises.rename(file.path, filepath);
      return filename;
    } catch (error) {
      if (fs.existsSync(file.path)) {
        await fs.promises.unlink(file.path);
      }
      throw error;
    }
  }

  async updateCoverImage(
    postId: number,
    file: Express.Multer.File,
    tokenPayload: TokenPayloadDto,
  ) {
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

      await this.deleteOldCoverImage(post.coverImage);

      const filename = await this.saveCoverImage(file);

      post.coverImage = filename;
      await this.postRepository.save(post);

      return {
        postId: postId,
        coverImage: filename,
        message: 'Cover image updated successfully',
      };
    } catch (error) {
      if (file.filename) {
        const filePath = path.join(this.UPLOAD_DIR, file.filename);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      }
      throw error;
    }
  }
}
