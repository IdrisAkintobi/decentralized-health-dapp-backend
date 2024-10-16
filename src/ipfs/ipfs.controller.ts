import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    ParseFilePipeBuilder,
    Post,
    Query,
    UploadedFile,
    UseFilters,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ErrorExceptionFilter } from '../utils/exception-handler/error-exception.filter.js';
import { HttpResponse } from '../utils/http-resources/http-response.js';
import { HttpResponseMapper } from '../utils/http-resources/http-response.mapper.js';
import { GetRecordsRequestDto, GetRequestDto, PostRequestDto } from './dto/request.dto.js';
import { IPFSService } from './ipfs.service.js';

@UseFilters(ErrorExceptionFilter)
@Controller()
export class IpfsController {
    constructor(private readonly ipfsService: IPFSService) {}

    @Get('/')
    @HttpCode(HttpStatus.CREATED)
    async getStatus(): Promise<string> {
        return 'Server is up';
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post('/file')
    @HttpCode(HttpStatus.CREATED)
    async uploadFile(
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addMaxSizeValidator({ maxSize: 2 * 1024 * 1024 }) //2MB
                .addFileTypeValidator({ fileType: /(csv|png|jpeg|jpg|txt)$/i })
                .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
        )
        file: Express.Multer.File,
    ): Promise<HttpResponse<{ cid: string }>> {
        const cid = await this.ipfsService.uploadFile(file);
        return HttpResponseMapper.map({ cid });
    }

    @Post('/record')
    @HttpCode(HttpStatus.CREATED)
    async uploadRecord(@Body() body: PostRequestDto): Promise<HttpResponse<{ cid: string }>> {
        const cid = await this.ipfsService.uploadRecord(body);
        return HttpResponseMapper.map({ cid });
    }

    @Get('/file')
    @HttpCode(HttpStatus.OK)
    async getFile(@Query() { hash }: GetRequestDto): Promise<HttpResponse<{ data: string }>> {
        const data = await this.ipfsService.getFile(hash);
        return HttpResponseMapper.map({ data });
    }

    @Get('/record')
    @HttpCode(HttpStatus.OK)
    async getRecord(@Query() { hash }: GetRequestDto): Promise<HttpResponse<{ data: PostRequestDto }>> {
        const data = await this.ipfsService.getRecord(hash);
        return HttpResponseMapper.map({ data });
    }

    @Post('/records')
    @HttpCode(HttpStatus.OK)
    async getRecords(@Body() { hashes }: GetRecordsRequestDto): Promise<HttpResponse<{ data: PostRequestDto[] }>> {
        const data = await this.ipfsService.getRecords(hashes);
        return HttpResponseMapper.map({ data });
    }
}
