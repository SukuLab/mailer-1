/** Dependencies **/
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import * as inlineCss from 'inline-css';
import * as glob from 'glob';
import { get } from 'lodash';
import { HelperDeclareSpec } from 'handlebars';

/** Interfaces **/
import { MailerOptions } from '../interfaces/mailer-options.interface';
import { TemplateAdapter } from '../interfaces/template-adapter.interface';
import { TemplateAdapterConfig } from '../interfaces/template-adapter-config.interface';

export class HandlebarsAdapter implements TemplateAdapter {
  private precompiledTemplates: {
    [idd: string]: handlebars.TemplateDelegate;
  } = {};
  private precompiledPartials: {
    [idd: string]: handlebars.TemplateDelegate;
  } = {};

  private config: TemplateAdapterConfig = {
    inlineCssOptions: { url: ' ' },
    inlineCssEnabled: true,
  };

  constructor(helpers?: HelperDeclareSpec, config?: TemplateAdapterConfig) {
    handlebars.registerHelper('concat', (...args) => {
      args.pop();
      return args.join('');
    });
    handlebars.registerHelper(helpers || {});
    Object.assign(this.config, config);
  }

  public compile(
    mailTemplate: string,
    mailContext: any,
    callback: any,
    mailerOptions: MailerOptions,
  ): void {
    const precompile = (template: any, options: any, precompileCache) => {
      const templateExt = path.extname(template) || '.hbs';
      const templateName = path.basename(template, path.extname(template));
      const templateDir = template.startsWith('./')
        ? path.dirname(template)
        : get(options, 'dir', '');
      const templateIdGetter = get(
        options,
        'templateIdGetter',
        () => templateName,
      );
      const templateId = templateIdGetter(template);
      const templatePath = path.join(templateDir, templateName + templateExt);

      let error = null;
      if (!precompileCache[templateId]) {
        try {
          const template = fs.readFileSync(templatePath, 'UTF-8');

          precompileCache[templateId] = handlebars.compile(
            template,
            get(options, 'options', {}),
          );
        } catch (err) {
          error = err;
        }
      }

      return {
        error,
        templateExt,
        templateName,
        templateId,
        templateDir,
        templatePath,
      };
    };

    const { templateId, error } = precompile(
      mailTemplate,
      mailerOptions.template,
      this.precompiledTemplates,
    );
    if (error) {
      return callback(error);
    }

    const runtimeOptions = get(mailerOptions, 'options', {
      partials: false,
      data: {},
    });

    if (runtimeOptions.partials) {
      const files = glob.sync(path.join(runtimeOptions.partials.dir, '*.hbs'));
      files.forEach((file) =>
        precompile(file, runtimeOptions.partials, this.precompiledPartials),
      );
    }

    const rendered = this.precompiledTemplates[templateId](mailContext, {
      ...runtimeOptions,
      partials: this.precompiledPartials,
    });

    if (this.config.inlineCssEnabled) {
      inlineCss(rendered, this.config.inlineCssOptions).then((html) => {
        return callback(null, html);
      });
    } else {
      return callback(null, rendered);
    }
  }
}
