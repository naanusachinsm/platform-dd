import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { Transaction, Op } from 'sequelize';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { OrganizationRepository } from '../organizations.repository';
import { defaultOrganizationConfig } from '../config/organization.config';

@Injectable()
export class OrganizationValidator {
  private readonly config = defaultOrganizationConfig;

  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async validateAndSanitize(
    dto: CreateOrganizationDto | UpdateOrganizationDto,
    options: {
      isUpdate?: boolean;
      excludeId?: string;
      transaction?: Transaction;
    } = {}
  ): Promise<CreateOrganizationDto | UpdateOrganizationDto> {
    const sanitized = this.config.security.enableInputSanitization
      ? this.sanitize(dto)
      : { ...dto };

    this.validateLengths(sanitized);

    const dtoClass = options.isUpdate ? UpdateOrganizationDto : CreateOrganizationDto;
    const validationErrors = await validate(
      plainToInstance(dtoClass, sanitized)
    );

    if (validationErrors.length > 0) {
      const messages = validationErrors.flatMap(error =>
        Object.values(error.constraints || {})
      );
      throw new BadRequestException(messages.join(', '));
    }

    await this.validateUniqueness(sanitized, options);

    return sanitized;
  }

  private validateLengths(dto: CreateOrganizationDto | UpdateOrganizationDto): void {
    const { validation } = this.config;
    const checks: [string | undefined, number, string][] = [
      [dto.name, validation.maxNameLength, 'Name'],
      [dto.slug, validation.maxSlugLength, 'Slug'],
      [dto.domain, validation.maxDomainLength, 'Domain'],
      [dto.description, validation.maxDescriptionLength, 'Description'],
      [dto.website, validation.maxWebsiteLength, 'Website'],
      [dto.address, validation.maxAddressLength, 'Address'],
      [dto.city, validation.maxCityLength, 'City'],
      [dto.state, validation.maxStateLength, 'State'],
      [dto.country, validation.maxCountryLength, 'Country'],
      [dto.postalCode, validation.maxPostalCodeLength, 'Postal code'],
      [dto.phone, validation.maxPhoneLength, 'Phone'],
      [dto.email, validation.maxEmailLength, 'Email'],
    ];

    for (const [value, maxLen, field] of checks) {
      if (value && value.length > maxLen) {
        throw new BadRequestException(`${field} must not exceed ${maxLen} characters`);
      }
    }
  }

  private sanitize(dto: CreateOrganizationDto | UpdateOrganizationDto): CreateOrganizationDto | UpdateOrganizationDto {
    const sanitized = { ...dto };

    if (sanitized.slug && sanitized.slug.trim()) {
      sanitized.slug = sanitized.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!sanitized.slug) {
        delete sanitized.slug;
      }
    } else {
      delete sanitized.slug;
    }

    if (sanitized.domain) {
      sanitized.domain = sanitized.domain
        .replace(/^https?:\/\//i, '')
        .replace(/\/$/, '');
    }

    if (sanitized.name) {
      sanitized.name = sanitized.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key];
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      }
    });

    return sanitized;
  }

  private async validateUniqueness(
    dto: CreateOrganizationDto | UpdateOrganizationDto,
    options: { excludeId?: string; transaction?: Transaction }
  ): Promise<void> {
    if (dto.name && dto.name.trim()) {
      const nameWhere: any = {
        name: dto.name.trim(),
      };

      if (options.excludeId) {
        nameWhere.id = { [Op.ne]: options.excludeId };
      }

      const existingByName = await this.organizationRepository.findOne({
        where: nameWhere,
        transaction: options.transaction,
      });

      if (existingByName) {
        throw new ConflictException(
          `Organization with name '${dto.name.trim()}' already exists`,
        );
      }
    }

    if (dto.slug && dto.slug.trim()) {
      const slugWhere: any = {
        slug: dto.slug,
      };

      if (options.excludeId) {
        slugWhere.id = { [Op.ne]: options.excludeId };
      }

      const existingBySlug = await this.organizationRepository.findOne({
        where: slugWhere,
        transaction: options.transaction,
      });

      if (existingBySlug) {
        throw new ConflictException(
          `Organization with slug '${dto.slug}' already exists`,
        );
      }
    }
  }
}
