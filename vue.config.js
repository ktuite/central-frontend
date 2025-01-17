/*
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
module.exports = {
  chainWebpack: (config) => {
    /* eslint-disable indent */
    config.module
      .rule('json5')
        .test(/\/src\/locales\/en\.json5$/)
        .type('javascript/auto')
        .use('json5')
          .loader('json5-loader');
    /* eslint-enable indent */

    // We don't want to prefetch all locale files.
    config.plugins.delete('prefetch');
  },
  lintOnSave: false,
  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: true
    }
  }
};
