import { Test, TestingModule } from '@nestjs/testing';
import { MetadataApiController } from './metadata-api.controller';
import { MetadataApiService } from './metadata-api.service';

describe('MetadataApiController', () => {
  let metadataApiController: MetadataApiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MetadataApiController],
      providers: [MetadataApiService],
    }).compile();

    metadataApiController = app.get<MetadataApiController>(MetadataApiController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(metadataApiController.getHello()).toBe('Hello World!');
    });
  });
});
