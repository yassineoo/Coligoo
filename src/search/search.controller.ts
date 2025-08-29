import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { SearchService } from './search.service';
import { FilterDto } from 'src/common/filters/filter.dto';
import { SearchFilterDto } from './dto/search-filter.dto';
import { ApiTags } from '@nestjs/swagger';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchNearbyDto } from './dto/search-nearby.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('search')
@ApiTags('Search')
@UseInterceptors(CacheInterceptor)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}
/*
  @Get("/")
  getAll(@Query() filter: SearchFilterDto) {
    return this.searchService.getAll(filter);
  }

  @Get("/name")
  getByName(@Query() filter: SearchQueryDto) {
    return this.searchService.getByName(filter);
  }

  @Get("/nearby")
  getNearby(@Query() filter: SearchNearbyDto) {
    return this.searchService.getNearby(filter);
  }
    */
}
