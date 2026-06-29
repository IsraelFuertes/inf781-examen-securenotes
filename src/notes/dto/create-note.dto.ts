import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  content: string;
}