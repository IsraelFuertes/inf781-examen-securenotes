import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
  ) {}

  @Post()
  async create(
    @Body() createNoteDto: CreateNoteDto,
    @GetUser() user: any,
  ) {
    return this.notesService.create(
      createNoteDto,
      user.id,
    );
  }

  @Get()
  async findAll(
    @GetUser() user: any,
  ) {
    return this.notesService.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.notesService.findOne(
      id,
      user.id,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @GetUser() user: any,
  ) {
    return this.notesService.update(
      id,
      user.id,
      updateNoteDto,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.notesService.remove(
      id,
      user.id,
    );
  }
}