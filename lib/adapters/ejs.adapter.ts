/** Dependencies **/
import {
  AsyncTemplateFunction,
  ClientFunction,
  compile,
  TemplateFunction,
} from 'ejs';
import { get } from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as inlineCss from 'inline-css';

/** Interfaces **/
import { MailerOptions } from '../interfaces/mailer-options.interface';
import { TemplateAdapter } from '../interfaces/template-adapter.interface';
import { TemplateAdapterConfig } from '../interfaces/template-adapter-config.interface';

export class EjsAdapter implements TemplateAdapter {
  private precompiledTemplates: {
    [id: string]: TemplateFunction | AsyncTemplateFunction | ClientFunction;
  } = {};

  private config: TemplateAdapterConfig = {
    inlineCssOptions: { url: ' ' },
    inlineCssEnabled: true,
  };

  constructor(config?: TemplateAdapterConfig) {
    Object.assign(this.config, config);
  }

  public compile(
    mailTemplate: string,
    mailContext: any,
    callback: any,
    mailerOptions: MailerOptions,
  ): void {
    const templateExt = path.extname(mailTemplate) || '.ejs';
    const templateName = path.basename(
      mailTemplate,
      path.extname(mailTemplate),
    );
    const templateDir = mailTemplate.startsWith('./')
      ? path.dirname(mailTemplate)
      : get(mailerOptions, 'template.dir', '');
    const templateIdGetter = get(
      mailerOptions,
      'template.templateIdGetter',
      () => templateName,
    );
    const templateId = templateIdGetter(mailTemplate);
    const templatePath = path.join(templateDir, templateName + templateExt);

    if (!this.precompiledTemplates[templateId]) {
      try {
        const template = fs.readFileSync(templatePath, 'UTF-8');

        this.precompiledTemplates[templateId] = compile(template, {
          ...get(mailerOptions, 'template.options', {}),
          filename: templatePath,
        });
      } catch (err) {
        return callback(err);
      }
    }

    const rendered = this.precompiledTemplates[templateId](mailContext);

    const render = (html: string) => {
      if (this.config.inlineCssEnabled) {
        inlineCss(html, this.config.inlineCssOptions).then((html) => {
          return callback(html);
        });
      } else {
        return callback(html);
      }
    };

    if (typeof rendered === 'string') {
      render(rendered);
    } else {
      rendered.then(render);
    }
  }
}
