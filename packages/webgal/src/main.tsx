import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.scss';
import './assets/style/animation.scss';
import 'modern-css-reset/dist/reset.min.css';

/** i18n */
import i18n from 'i18next';
import { initReactI18next, Trans } from 'react-i18next';
import { defaultLanguage, i18nTranslationResources, language } from './config/language';
import { Provider } from 'react-redux';
import { webgalStore } from './store/store';

i18n
  .use(initReactI18next)
  .init({
    resources: i18nTranslationResources || {},
    lng: language[defaultLanguage] || 'zhCn',
    fallbackLng: 'zhCn',
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => console.log('WebGAL i18n Ready!'));

// eslint-disable-next-line react/no-deprecated
ReactDOM.render(
  <StrictMode>
    <Trans>
      <Provider store={webgalStore}>
        <App />
      </Provider>
    </Trans>
  </StrictMode>,
  document.getElementById('root'),
);