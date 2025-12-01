// import { Injectable, Logger } from '@nestjs/common';
// // import { StorageService } from '@app/database'; // libs/common storage.service.ts
// // import { AmqpService } from '@app/database'; // libs/common amqp.service.ts
// import { randomUUID } from 'crypto';

// @Injectable()
// export class UploadService {
//   private readonly logger = new Logger(UploadService.name);
//   private readonly queueName = process.env.RABBITMQ_QUEUE_FILE_UPLOADED ?? 'file.uploaded';

//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly storage: StorageService,
//     private readonly amqp: AmqpService,
//   ) {}

//   async requestUpload(dto: { name?: string; mimeType?: string; sizeInBytes?: number }) {
//     const id = randomUUID();
//     const storageKey = `${id}/${dto.name ?? id}`;

//     // cria registro inicial no DB (PENDING)
//     const file = await this.prisma.file.create({
//       data: {
//         id,
//         name: dto.name ?? null,
//         storageKey,
//         status: 'PENDING',
//         mimeType: dto.mimeType ?? null,
//         sizeInBytes: dto.sizeInBytes ?? null,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     });

//     // garante bucket (silencioso)
//     await this.storage.ensureBucketExists();

//     const uploadUrl = await this.storage.getPresignedPutUrl(storageKey);

//     return {
//       id: file.id,
//       storageKey,
//       uploadUrl,
//       expiresIn: Number(process.env.PRESIGNED_EXPIRES ?? 900),
//     };
//   }

//   // idempotente: se já estiver PROCESSING/PROCESSED, retorna sem republicar
//   async completeUpload(id: string) {
//     const file = await this.prisma.file.findUnique({ where: { id } });
//     if (!file) throw new Error('File not found');

//     if (file.status === 'PROCESSING' || file.status === 'PROCESSED') {
//       return { success: true, published: false, reason: 'already_processed_or_processing' };
//     }

//     // verifica objeto no MinIO
//     try {
//       const stat = await this.storage.statObject(file.storageKey);
//       // opcional: checar tamanho
//       if (file.sizeInBytes && Number(stat.size) !== Number(file.sizeInBytes)) {
//         this.logger.warn(`Tamanho do objeto (${stat.size}) difere do informado (${file.sizeInBytes})`);
//         // continuar ou abortar conforme sua regra; aqui continuamos
//       }
//     } catch (err) {
//       this.logger.error('Objeto não encontrado no storage', err);
//       throw new Error('Uploaded object not found');
//     }

//     // atualiza para PROCESSING
//     await this.prisma.file.update({
//       where: { id },
//       data: { status: 'PROCESSING', updatedAt: new Date() },
//     });

//     // publica evento na fila
//     const payload = {
//       id: file.id,
//       storageKey: file.storageKey,
//       mimeType: file.mimeType,
//       sizeInBytes: file.sizeInBytes,
//     };

//     await this.amqp.publish(this.queueName, payload);
//     return { success: true, published: true };
//   }
// }