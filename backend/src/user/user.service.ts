import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/utils/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private db: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    if (
      createUserDto.role !== 'DISTRIBUTOR' &&
      createUserDto.role !== 'MAKER' &&
      createUserDto.role !== 'DILER'
    ) {
      throw new BadRequestException('Role must be DISTRIBUTOR or MAKER');
    }
    if (createUserDto.role === 'MAKER' && !createUserDto.country) {
      throw new BadRequestException('Country is required for MAKER role');
    }

    const promises = [
      this.db.user.findFirst({ where: { INN: createUserDto.INN } }),
      this.db.user.findFirst({ where: { BIK: createUserDto.BIK } }),
      this.db.user.findFirst({ where: { KPP: createUserDto.KPP } }),
      this.db.user.findFirst({
        where: { paymentAccount: createUserDto.paymentAccount },
      }),
      this.db.user.findFirst({
        where: { contactNumber: createUserDto.contactNumber },
      }),
    ];

    const [inn, bik, kpp, paymentAccount, contactNumber] =
      await Promise.all(promises);

    if (inn) {
      throw new BadRequestException('ИНН уже существует');
    }
    if (bik) {
      throw new BadRequestException('БИК уже существует');
    }
    if (kpp) {
      throw new BadRequestException('КПП уже существует');
    }
    if (paymentAccount) {
      throw new BadRequestException('Р/С уже существует');
    }
    if (contactNumber) {
      throw new BadRequestException('Контактный телефон уже существует');
    }

    return await this.db.user.create({ data: createUserDto });
  }

  async findAll() {
    return await this.db.user.findMany();
  }

  async findAllByRole(role: string) {
    return await this.db.user.findMany({
      where: { role: Role[role] },
      select: {
        id: true,
        companyName: true,
        role: true,
        INN: true,
        BIK: true,
        KPP: true,
        paymentAccount: true,
        legalAddress: true,
        country: true,
        contactNumber: true,
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            characteristics: true,
          },
        },
        makerProducts: {
          select: {
            id: true,
            name: true,
            price: true,
            characteristics: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const user = await this.db.user.findFirst({ where: { id } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (
      updateUserDto.role === 'MAKER' &&
      !updateUserDto.country &&
      user.country
    ) {
      throw new BadRequestException(
        'Страна для производителя должна быть определена',
      );
    }

    const promises = [
      updateUserDto.INN &&
        updateUserDto.INN != user.INN &&
        this.db.user.findFirst({ where: { INN: updateUserDto.INN } }),
      updateUserDto.BIK &&
        updateUserDto.BIK != user.BIK &&
        this.db.user.findFirst({ where: { BIK: updateUserDto.BIK } }),
      updateUserDto.KPP &&
        updateUserDto.KPP != user.KPP &&
        this.db.user.findFirst({ where: { KPP: updateUserDto.KPP } }),
      updateUserDto.paymentAccount &&
        updateUserDto.paymentAccount != user.paymentAccount &&
        this.db.user.findFirst({
          where: { paymentAccount: updateUserDto.paymentAccount },
        }),
      updateUserDto.contactNumber &&
        updateUserDto.contactNumber != user.contactNumber &&
        this.db.user.findFirst({
          where: { contactNumber: updateUserDto.contactNumber },
        }),
    ];
    const [inn, bik, kpp, paymentAccount, contactNumber] =
      await Promise.all(promises);
    if (inn) {
      throw new BadRequestException('ИНН уже существует');
    }
    if (bik) {
      throw new BadRequestException('БИК уже существует');
    }
    if (kpp) {
      throw new BadRequestException('КПП уже существует');
    }
    if (paymentAccount) {
      throw new BadRequestException('Р/С уже существует');
    }
    if (contactNumber) {
      throw new BadRequestException('Контактный телефон уже существует');
    }
    return await this.db.user.update({
      where: { id },
      data: {
        ...updateUserDto,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.db.user.delete({ where: { id } });
  }
}
