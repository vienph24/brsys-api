import { Module, Provider } from '@nestjs/common';
import { B2FileStorageService } from '@app/shared/services/b2-file-storage.service';
import { FILE_STORAGE } from '@app/shared/common/constants';

const fileStorageProvider: Provider = {
    provide: FILE_STORAGE,
    useClass: B2FileStorageService,
};

@Module({
    providers: [fileStorageProvider],
    exports: [fileStorageProvider],
})
export class FileStorageModule {}
