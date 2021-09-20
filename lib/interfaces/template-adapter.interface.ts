/** Interfaces **/
import { MailerOptions } from './mailer-options.interface';

export interface TemplateAdapter {
  compile(
    mailTemplate: string,
    mailContext: any,
    callback: (err?: any, body?: string) => any,
    options: MailerOptions,
  ): void;
}
