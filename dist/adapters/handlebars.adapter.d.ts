import { HelperDeclareSpec } from 'handlebars';
import { MailerOptions } from '../interfaces/mailer-options.interface';
import { TemplateAdapter } from '../interfaces/template-adapter.interface';
import { TemplateAdapterConfig } from '../interfaces/template-adapter-config.interface';
export declare class HandlebarsAdapter implements TemplateAdapter {
    private precompiledTemplates;
    private precompiledPartials;
    private config;
    constructor(helpers?: HelperDeclareSpec, config?: TemplateAdapterConfig);
    compile(mailTemplate: string, mailContext: any, callback: any, mailerOptions: MailerOptions): void;
}
