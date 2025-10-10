import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// UpdateUserDto inherits all fields from CreateUserDto but marks them as optional.
export class UpdateUserDto extends PartialType(CreateUserDto) {}