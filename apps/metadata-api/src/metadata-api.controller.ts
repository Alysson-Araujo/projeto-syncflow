import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MetadataApiService } from './metadata-api.service';
import { ListFilesDto } from './dto/list-files.dto';
import { FileResponseDto, ListFilesResponseDto } from './dto/file-response.dto';

@ApiTags('files')
@Controller('files')
export class MetadataApiController {
  private readonly logger = new Logger(MetadataApiController.name);

  constructor(private readonly metadataApiService: MetadataApiService) {}

  @Get()
  @ApiOperation({ summary: 'Listar arquivos', description: 'Lista todos os arquivos com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista de arquivos', type: ListFilesResponseDto })
  async listFiles(@Query() query: ListFilesDto): Promise<ListFilesResponseDto> {
    this.logger.log(`GET /files - Query: ${JSON.stringify(query)}`);
    return this.metadataApiService.listFiles(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas gerais', description: 'Retorna estatísticas do sistema' })
  @ApiResponse({ status: 200, description:  'Estatísticas' })
  async getStats() {
    this.logger.log('GET /files/stats');
    return this.metadataApiService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar arquivo por ID', description: 'Retorna detalhes de um arquivo específico' })
  @ApiParam({ name: 'id', description: 'ID do arquivo (UUID)' })
  @ApiResponse({ status: 200, description: 'Arquivo encontrado', type: FileResponseDto })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async getFileById(@Param('id') id: string): Promise<FileResponseDto> {
    this.logger.log(`GET /files/${id}`);
    return this.metadataApiService.getFileById(id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Status do arquivo', description: 'Retorna apenas o status de processamento' })
  @ApiParam({ name: 'id', description: 'ID do arquivo (UUID)' })
  @ApiResponse({ status: 200, description:  'Status do arquivo' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async getFileStatus(@Param('id') id: string) {
    this.logger.log(`GET /files/${id}/status`);
    return this.metadataApiService.getFileStatus(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'URL de download', description: 'Gera uma URL temporária para download' })
  @ApiParam({ name: 'id', description: 'ID do arquivo (UUID)' })
  @ApiResponse({ status: 200, description: 'URL de download gerada' })
  @ApiResponse({ status: 404, description:  'Arquivo não encontrado ou não pronto' })
  async getDownloadUrl(@Param('id') id: string) {
    this.logger.log(`GET /files/${id}/download`);
    return this.metadataApiService.getDownloadUrl(id);
  }
}