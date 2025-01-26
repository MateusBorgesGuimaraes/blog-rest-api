import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/users/entities/user.entity';

export class LoginResponseDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 'ichigo@gmail.com' })
  email: string;

  @ApiProperty({ example: 'ichigo' })
  name: string;

  @ApiProperty({ example: 'fakefot.com' })
  profilePicture: string;

  @ApiProperty({
    example: 'blogger',
    enum: UserRole,
  })
  role: UserRole;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}
