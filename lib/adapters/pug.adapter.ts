/** Dependencies **/
import * as path from 'path';
import { get } from 'lodash';
import { renderFile } from 'pug';
import * as inlineCss from 'inline-css';

/** Interfaces **/
import { MailerOptions } from '../interfaces/mailer-options.interface';
import { TemplateAdapter } from '../interfaces/template-adapter.interface';
import { TemplateAdapterConfig } from '../interfaces/template-adapter-config.interface';

export class PugAdapter implements TemplateAdapter {
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
    const templateExt = path.extname(mailTemplate) || '.pug';
    const templateName = path.basename(
      mailTemplate,
      path.extname(mailTemplate),
    );
    const templateDir = mailTemplate.startsWith('./')
      ? path.dirname(mailTemplate)
      : get(mailerOptions, 'template.dir', '');
    const templatePath = path.join(templateDir, templateName + templateExt);

    const options = {
      ...mailContext,
      ...get(mailerOptions, 'template.options', {}),
    };

    renderFile(templatePath, options, (err, body) => {
      if (err) {
        return callback(err);
      }

      if (this.config.inlineCssEnabled) {
        inlineCss(body, this.config.inlineCssOptions).then((html) => {
          return callback(null, html);
        });
      } else {
        return callback(null, body);
      }
    });
  }
}
