import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from 'src/configuration/jwt/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): { message: string } {
    return { message: this.appService.getWelcomeMessage() };
  }

  @Public()
  @Get('health')
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
