import { Test, TestingModule } from '@nestjs/testing';
import { ProcessingServiceController } from './processing-service.controller';
import { ProcessingServiceService } from './processing-service.service';

describe('ProcessingServiceController', () => {
  let processingServiceController: ProcessingServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ProcessingServiceController],
      providers: [ProcessingServiceService],
    }).compile();

    processingServiceController = app.get<ProcessingServiceController>(ProcessingServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(processingServiceController.getHello()).toBe('Hello World!');
    });
  });
});
