import { basename, extname } from 'path';
import { generateId } from './generator';
import * as mime from 'mime-types';
import { Document } from '@app/shared/common/enums';

export function getNewName(fileName: string): string {
    const removedExtension = basename(fileName, extname(fileName));
    const suffix = `${generateId()}${extname(fileName)}`;

    return `${removedExtension}_${suffix}`;
}

export function getFileType(mimetype: string | undefined): string | null {
    if (!mimetype) return null;
    const ext = mime.extension(mimetype);
    if (ext === 'xls' || ext === 'xlsx') {
        return Document.Excel;
    }
    if (ext === 'csv') return Document.Csv;
    return null;
}
