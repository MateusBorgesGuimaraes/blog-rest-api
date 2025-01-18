import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const userData = {
        name: createUserDto.name,
        email: createUserDto.email,
        profilePicture: createUserDto.profilePicture,
        passwordHash: createUserDto.password,
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

  async findAll() {
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

  async findOne(id: number) {
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

  update(id: number, updateUserDto: UpdateUserDto) {
    // probrably not needed
  }

  remove(id: number) {
    // probrably not needed
  }
}
