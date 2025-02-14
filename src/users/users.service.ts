import {
  BadRequestException,
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
// import path from 'path';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly hashingService: HashingService,
  ) {}

  private readonly UPLOAD_DIR = './uploads/profiles';

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

      await this.userRepository.save(newUser);

      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        profilePicture: newUser.profilePicture,
        role: newUser.role,
      };
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

      return {
        postId: post.id,
        message: 'Post saved successfully',
      };
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
    console.log('Received userId:', userId, 'Type:', typeof userId);

    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
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

  async getBloggerPosts(userId: number, query: PaginationQueryDto) {
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
        author: { id: userId },
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

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  private generateUniqueFilename(originalFilename: string): string {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(originalFilename);
    return `user-profile-${uniqueSuffix}${ext}`;
  }

  private async deleteOldProfileImage(profilePicture: string): Promise<void> {
    if (profilePicture) {
      const oldImagePath = path.join(this.UPLOAD_DIR, profilePicture);
      if (fs.existsSync(oldImagePath)) {
        await fs.promises.unlink(oldImagePath);
      }
    }
  }

  private async saveProfileImage(file: Express.Multer.File): Promise<string> {
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

  async updateProfileImage(userId: number, file: Express.Multer.File) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.deleteOldProfileImage(user.profilePicture);

      const filename = await this.saveProfileImage(file);

      user.profilePicture = filename;
      await this.userRepository.save(user);

      return {
        userId: userId,
        profilePicture: filename,
        message: 'Profile image updated successfully',
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
