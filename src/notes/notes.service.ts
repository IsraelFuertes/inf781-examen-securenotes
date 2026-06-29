import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notesRepository: Repository<Note>,
  ) {}

  async create(
    createNoteDto: CreateNoteDto,
    ownerId: string,
  ) {
    const note = this.notesRepository.create({
      title: createNoteDto.title,
      content: createNoteDto.content,
      owner: {
        id: ownerId,
      },
    });

    return await this.notesRepository.save(note);
  }

  async findAll(ownerId: string) {
    return await this.notesRepository.find({
      where: {
        owner: {
          id: ownerId,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string, ownerId: string) {
    const note = await this.notesRepository.findOne({
      where: {
        id,
        owner: {
          id: ownerId,
        },
      },
    });

    if (!note) {
      throw new NotFoundException('Nota no encontrada');
    }

    return note;
  }

  async update(
    id: string,
    ownerId: string,
    updateNoteDto: UpdateNoteDto,
  ) {
    const note = await this.findOne(id, ownerId);

    Object.assign(note, updateNoteDto);

    return await this.notesRepository.save(note);
  }

  async remove(
    id: string,
    ownerId: string,
  ) {
    const note = await this.findOne(id, ownerId);

    await this.notesRepository.remove(note);

    return {
      message: 'Nota eliminada correctamente',
    };
  }
}