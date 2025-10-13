import { Global, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Global() // Make this module globally available
@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads', // The folder where files will be saved
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
        },
      }),
    }),
  ],
  exports: [MulterModule], // Export so other modules can use it
})
export class FilesModule {}